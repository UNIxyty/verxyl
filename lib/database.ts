import { supabase, isSupabaseConfigured } from './supabase'
import type { Database } from './supabase'
import { extractDateTime, getUserFullName, getUserEmail } from './webhook-utils'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type Ticket = Database['public']['Tables']['tickets']['Row']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']
type TicketUpdate = Database['public']['Tables']['tickets']['Update']

type AIPromptBackup = Database['public']['Tables']['ai_prompt_backups']['Row']
type AIPromptBackupInsert = Database['public']['Tables']['ai_prompt_backups']['Insert']

type N8NProjectBackup = Database['public']['Tables']['n8n_project_backups']['Row']
type N8NProjectBackupInsert = Database['public']['Tables']['n8n_project_backups']['Insert']

// User operations
export const createOrUpdateUser = async (userData: UserInsert): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.')
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error creating/updating user:', error)
    return null
  }

  return data
}

export const getUserById = async (id: string): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.')
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return data
}

export const updateUser = async (id: string, updates: UserUpdate): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return null
  }

  return data
}

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error getting all users:', error)
    return []
  }

  return data || []
}

// Webhook sending function
export async function sendWebhook(webhookUrl: string, payload: any) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook failed with status: ${response.status}`)
      return false
    }

    const responseText = await response.text()
    console.log('Webhook response:', responseText)
    return true
  } catch (error) {
    console.error('Webhook error:', error)
    return false
  }
}

// Send webhook for ticket events
export async function sendTicketWebhook(ticketId: string, action: string) {
  try {
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:created_by(id, email, full_name),
        assignee:assigned_to(id, email, full_name)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('Error fetching ticket for webhook:', ticketError)
      return false
    }

    // Get creator and assignee webhook URLs
    const creatorWebhookUrl = ticket.creator?.webhook_url
    const assigneeWebhookUrl = ticket.assignee?.webhook_url

    // Prepare webhook payload
    const dateTimeInfo = ticket.deadline ? extractDateTime(ticket.deadline) : { dateTicket: null, timeTicket: null }
    const payload = {
      ticketAction: action,
      ticket_id: ticket.id,
      urgency: ticket.urgency,
      dateTicket: dateTimeInfo.dateTicket,
      timeTicket: dateTimeInfo.timeTicket,
      creatorName: getUserFullName(ticket.creator),
      workerName: getUserFullName(ticket.assignee),
      creatorEmail: getUserEmail(ticket.creator),
      workerEmail: getUserEmail(ticket.assignee),
      ticketTitle: ticket.title,
      ticketDetails: ticket.details,
      ticketStatus: ticket.status
    }

    let success = true

    // Send to creator's webhook if available
    if (creatorWebhookUrl) {
      const creatorSuccess = await sendWebhook(creatorWebhookUrl, payload)
      if (!creatorSuccess) success = false
    }

    // Send to assignee's webhook if available and different from creator
    if (assigneeWebhookUrl && assigneeWebhookUrl !== creatorWebhookUrl) {
      const assigneeSuccess = await sendWebhook(assigneeWebhookUrl, payload)
      if (!assigneeSuccess) success = false
    }

    return success
  } catch (error) {
    console.error('Error sending ticket webhook:', error)
    return false
  }
}

// Ticket operations
export const createTicket = async (ticketData: TicketInsert): Promise<Ticket | null> => {
  console.log('Creating ticket with data:', ticketData)
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.')
    console.error('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    })
    throw new Error('Database not configured - missing Supabase environment variables')
  }
  
  // Validate deadline format if provided
  if (ticketData.deadline) {
    try {
      const testDate = new Date(ticketData.deadline)
      if (isNaN(testDate.getTime())) {
        console.error('Invalid deadline format:', ticketData.deadline)
        throw new Error('Invalid deadline format')
      }
      console.log('Deadline validation passed:', ticketData.deadline, '->', testDate.toISOString())
    } catch (error) {
      console.error('Deadline validation failed:', error)
      throw new Error('Invalid deadline format')
    }
  }
  
  console.log('Inserting ticket into database...')
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .single()

  if (error) {
    console.error('Error creating ticket:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`Database error: ${error.message}`)
  }

  console.log('Ticket created successfully:', data)

  // Send webhook for ticket creation
  try {
    await sendTicketWebhook(data.id, 'created')
  } catch (webhookError) {
    console.error('Webhook error (non-blocking):', webhookError)
  }

  return data as Ticket
}

export const updateTicket = async (id: string, updates: TicketUpdate): Promise<Ticket | null> => {
  // First, get the current ticket status to check for changes
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching current ticket:', fetchError)
    return null
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .single()

  if (error) {
    console.error('Error updating ticket:', error)
    return null
  }

  // Send webhook for ticket update if status changed to completed
  if (updates.status === 'completed' && currentTicket.status !== 'completed') {
    try {
      await sendTicketWebhook(id, 'solved')
    } catch (webhookError) {
      console.error('Webhook error (non-blocking):', webhookError)
    }
  } else if (updates.status === 'in_progress' && currentTicket.status !== 'in_progress') {
    try {
      await sendTicketWebhook(id, 'updated')
    } catch (webhookError) {
      console.error('Webhook error (non-blocking):', webhookError)
    }
  }

  return data as Ticket
}

export const getTicketsByAssignedUser = async (userId: string): Promise<any[]> => {
  console.log('Getting tickets for user:', userId)
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting tickets by assigned user:', error)
    return []
  }

  console.log('Found tickets:', data?.length || 0, data)
  return data || []
}

export const getTicketsByCreator = async (userId: string): Promise<any[]> => {
  console.log('Getting tickets created by user:', userId)
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting tickets by creator:', error)
    return []
  }

  console.log('Found tickets created by user:', data?.length || 0, data)
  return data || []
}

export const getCompletedTickets = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .eq('assigned_to', userId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error getting completed tickets:', error)
    return []
  }

  return data || []
}

export const getAllTickets = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all tickets:', error)
    return []
  }

  return data || []
}

// Complete ticket with webhook
export const completeTicket = async (id: string, solutionData: any): Promise<Ticket | null> => {
  const updates = {
    status: 'completed' as const,
    solution_type: solutionData.solutionType,
    solution_data: solutionData.solutionData,
    output_result: solutionData.outputResult
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .single()

  if (error) {
    console.error('Error completing ticket:', error)
    return null
  }

  // Send webhook for ticket completion
  try {
    await sendTicketWebhook(id, 'solved')
  } catch (webhookError) {
    console.error('Webhook error (non-blocking):', webhookError)
  }

  return data as Ticket
}

// Edit ticket (one-time only)
export const editTicket = async (id: string, updates: TicketUpdate): Promise<Ticket | null> => {
  // First check if ticket has already been edited
  const { data: existingTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('edited')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error checking ticket edit status:', fetchError)
    return null
  }

  if (existingTicket.edited) {
    throw new Error('This ticket has already been edited and cannot be modified again.')
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ 
      ...updates, 
      edited: true,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .single()

  if (error) {
    console.error('Error editing ticket:', error)
    return null
  }

  // Send webhook for ticket edit
  try {
    await sendTicketWebhook(id, 'updated')
  } catch (webhookError) {
    console.error('Webhook error (non-blocking):', webhookError)
  }

  return data as Ticket
}

// Delete ticket with webhook
export const deleteTicket = async (id: string): Promise<boolean> => {
  console.log('Attempting to delete ticket:', id)
  
  // First get ticket data for webhook
  const { data: ticketData, error: fetchError } = await supabase
    .from('tickets')
    .select(`
      *,
      assigned_user:users!assigned_to(*),
      created_by_user:users!created_by(*)
    `)
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching ticket for deletion:', fetchError)
    return false
  }

  console.log('Ticket data fetched successfully:', ticketData)

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ticket:', error)
    return false
  }

  console.log('Ticket deleted successfully')

  // Send webhook for ticket deletion
  try {
    await sendTicketWebhook(id, 'deleted')
  } catch (webhookError) {
    console.error('Webhook error (non-blocking):', webhookError)
  }

  return true
}

// AI Prompt Backup operations
export const createAIPromptBackup = async (backupData: AIPromptBackupInsert): Promise<AIPromptBackup | null> => {
  const { data, error } = await supabase
    .from('ai_prompt_backups')
    .insert(backupData)
    .select()
    .single()

  if (error) {
    console.error('Error creating AI prompt backup:', error)
    return null
  }

  return data
}

export const getAIPromptBackups = async (userId: string): Promise<AIPromptBackup[]> => {
  const { data, error } = await supabase
    .from('ai_prompt_backups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting AI prompt backups:', error)
    return []
  }

  return data || []
}

// N8N Project Backup operations
export const createN8NProjectBackup = async (backupData: N8NProjectBackupInsert): Promise<N8NProjectBackup | null> => {
  const { data, error } = await supabase
    .from('n8n_project_backups')
    .insert(backupData)
    .select()
    .single()

  if (error) {
    console.error('Error creating N8N project backup:', error)
    return null
  }

  return data
}

export const getN8NProjectBackups = async (userId: string): Promise<N8NProjectBackup[]> => {
  const { data, error } = await supabase
    .from('n8n_project_backups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting N8N project backups:', error)
    return []
  }

  return data || []
}