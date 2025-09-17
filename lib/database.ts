import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase'
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

// Create notification for user
export async function createNotification(userId: string, type: string, title: string, message: string, redirectPath?: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        redirect_path: redirectPath,
        is_read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    console.log('Notification created successfully for user:', userId)
    return true
  } catch (error) {
    console.error('Error in createNotification:', error)
    return false
  }
}

// Webhook sending function
export async function sendWebhook(webhookUrl: string, payload: any) {
  try {
    console.log('Sending webhook to:', webhookUrl)
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))
    
    if (!webhookUrl || webhookUrl.trim() === '') {
      console.error('Webhook URL is empty or invalid')
      return false
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Verxyl-Ticket-System/1.0',
        'Accept': '*/*',
        'Accept-Encoding': 'br, gzip, deflate',
        'Accept-Language': '*',
        'Sec-Fetch-Mode': 'cors'
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook failed with status: ${response.status}`)
      const errorText = await response.text()
      console.error('Webhook error response:', errorText)
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
    const { data: ticket, error: ticketError } = await supabaseAdmin
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

    // Get system-wide webhook settings
    const { data: webhookSettings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['webhook_base_url', 'webhook_tickets_path', 'webhook_users_path'])

    if (settingsError) {
      console.error('Error fetching webhook settings:', settingsError)
      return false
    }

    // Parse webhook settings
    const settings: any = {}
    webhookSettings?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value
    })

    // Build webhook URLs
    const ticketsWebhookUrl = settings.webhook_base_url && settings.webhook_tickets_path
      ? `${settings.webhook_base_url}${settings.webhook_tickets_path}`
      : null

    // Map action to exact format
    const actionMap: { [key: string]: string } = {
      'created': 'ticket_created',
      'updated': 'ticket_updated',
      'in_work': 'ticket_in_work',
      'solved': 'ticket_solved',
      'deleted': 'ticket_deleted'
    }
    const webhookAction = actionMap[action] || action

    // Prepare webhook payload in exact format
    const dateTimeInfo = ticket.deadline ? extractDateTime(ticket.deadline) : { dateTicket: null, timeTicket: null }
    const payload = {
      action: webhookAction,
      ticket_id: ticket.id,
      ticket_title: ticket.title,
      ticket_urgency: ticket.urgency,
      ticket_deadline: ticket.deadline,
      ticket_date: dateTimeInfo.dateTicket,
      ticket_time: dateTimeInfo.timeTicket,
      creator_id: ticket.creator?.id,
      creator_email: ticket.creator?.email,
      creator_name: getUserFullName(ticket.creator),
      worker_id: ticket.assignee?.id,
      worker_email: ticket.assignee?.email,
      worker_name: getUserFullName(ticket.assignee)
    }

    let success = true

    console.log('System webhook URL found:', ticketsWebhookUrl)

    // Send to system webhook if available
    if (ticketsWebhookUrl) {
      console.log('Sending ticket webhook to system URL:', ticketsWebhookUrl)
      const webhookSuccess = await sendWebhook(ticketsWebhookUrl, payload)
      if (!webhookSuccess) success = false
    } else {
      console.log('No system webhook URL configured')
    }

    console.log('Ticket webhook sending result:', success)
    return success

  } catch (error) {
    console.error('Error sending ticket webhook:', error)
    return false
  }
}

// Send webhook for workflow/prompt sharing events
export async function sendSharingWebhook(shareData: any, action: string) {
  try {
    console.log('Sending sharing webhook for action:', action)
    console.log('Share data:', shareData)

    // Get system-wide webhook settings
    const { data: webhookSettings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['webhook_base_url', 'webhook_tickets_path'])

    if (settingsError) {
      console.error('Error fetching webhook settings:', settingsError)
      return false
    }

    // Parse webhook settings
    const settings: any = {}
    webhookSettings?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value
    })

    // Build webhook URLs (use tickets webhook for sharing events)
    const sharingWebhookUrl = settings.webhook_base_url && settings.webhook_tickets_path
      ? `${settings.webhook_base_url}${settings.webhook_tickets_path}`
      : null

    // Prepare webhook payload using existing ticket webhook schema + sharing fields
    const payload = {
      action: action, // 'workflowShared' or 'promptShared'
      ticket_id: null, // Not applicable for sharing events
      ticket_title: shareData.backup?.prompt_name || shareData.backup?.project_name || 'Unknown',
      ticket_urgency: null, // Not applicable for sharing events
      ticket_deadline: null, // Not applicable for sharing events
      ticket_date: null, // Not applicable for sharing events
      ticket_time: null, // Not applicable for sharing events
      creator_id: shareData.owner.id,
      creator_email: shareData.owner.email,
      creator_name: getUserFullName(shareData.owner),
      worker_id: shareData.recipient.id,
      worker_email: shareData.recipient.email,
      worker_name: getUserFullName(shareData.recipient),
      // Additional sharing-specific fields
      shared_from: {
        id: shareData.owner.id,
        email: shareData.owner.email,
        name: getUserFullName(shareData.owner)
      },
      shared_to: {
        id: shareData.recipient.id,
        email: shareData.recipient.email,
        name: getUserFullName(shareData.recipient)
      },
      workflow_prompt_title: shareData.backup?.prompt_name || shareData.backup?.project_name || 'Unknown',
      date_of_share: shareData.share?.shared_at || new Date().toISOString()
    }

    let success = true

    console.log('System sharing webhook URL found:', sharingWebhookUrl)

    // Send to system webhook if available
    if (sharingWebhookUrl) {
      console.log('Sending sharing webhook to system URL:', sharingWebhookUrl)
      const webhookSuccess = await sendWebhook(sharingWebhookUrl, payload)
      if (!webhookSuccess) success = false
    } else {
      console.log('No system webhook URL configured')
    }

    // Create notification for recipient
    try {
      await createNotification(
        shareData.recipient.id,
        action,
        action === 'workflowShared' ? 'Workflow Shared' : 'Prompt Shared',
        `${shareData.owner.full_name || shareData.owner.email} shared ${action === 'workflowShared' ? 'a workflow' : 'a prompt'} with you: ${shareData.backup?.prompt_name || shareData.backup?.project_name || 'Unknown'}`,
        action === 'workflowShared' ? '/n8n-backups' : '/ai-backups'
      )
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError)
    }

    console.log('Sharing webhook sending result:', success)
    return success

  } catch (error) {
    console.error('Error in sendSharingWebhook:', error)
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

  // Create notification for assigned user if different from creator
  if (data.assigned_to && data.assigned_to !== data.created_by) {
    try {
      await createNotification(
        data.assigned_to,
        'ticket_assigned',
        'New Ticket Assigned',
        `You have been assigned to ticket: ${data.title}`,
        `/my-tickets`
      )
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError)
    }
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

  // Send webhook and create notifications for ticket update if status changed
  if (updates.status === 'completed' && currentTicket.status !== 'completed') {
    try {
      await sendTicketWebhook(id, 'solved')
      // Notify creator that ticket is completed
      await createNotification(
        data.created_by,
        'ticket_completed',
        'Ticket Completed',
        `Your ticket "${data.title}" has been completed`,
        `/sent-tickets`
      )
    } catch (webhookError) {
      console.error('Webhook error (non-blocking):', webhookError)
    }
  } else if (updates.status === 'in_progress' && currentTicket.status !== 'in_progress') {
    try {
      await sendTicketWebhook(id, 'in_work')
      // Notify creator that ticket is in progress
      await createNotification(
        data.created_by,
        'ticket_updated',
        'Ticket In Progress',
        `Your ticket "${data.title}" is now in progress`,
        `/sent-tickets`
      )
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

  // Send webhook for ticket deletion BEFORE deleting
  try {
    await sendTicketWebhook(id, 'deleted')
  } catch (webhookError) {
    console.error('Webhook error (non-blocking):', webhookError)
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ticket:', error)
    return false
  }

  console.log('Ticket deleted successfully')

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