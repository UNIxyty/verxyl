import { supabase, isSupabaseConfigured } from './supabase'
import type { Database } from './supabase'
import { sendNewWebhook } from './new-webhook'
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
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket creation')
      
      // Get user notification settings for the ticket creator
      const { getUserNotificationSettings } = await import('./new-webhook')
      const notificationSettings = await getUserNotificationSettings(data.created_by)
      
      console.log('Notification settings for user:', data.created_by, notificationSettings)
      
      // Fallback to default settings if none found
      const finalNotificationSettings = notificationSettings || {
        newTicket: true,
        deleted_ticket: true,
        in_work_ticket: true,
        updatetTicket: true,
        solvedTicket: true,
        sharedWorkflow: true,
        sharedPrompt: true
      }
      
      console.log('Final notification settings being used:', finalNotificationSettings)
      
      // Ensure notification settings are included in webhook
      const webhookPayload = {
        action: 'ticket_created' as const,
        timestamp: new Date().toISOString(),
        ticket_id: data.id,
        ticket_title: data.title,
        ticket_urgency: data.urgency,
        ticket_deadline: data.deadline,
        ticket_date: dateTicket,
        ticket_time: timeTicket,
        creator_id: data.created_by,
        creator_email: getUserEmail(data.created_by_user),
        creator_name: getUserFullName(data.created_by_user),
        worker_id: data.assigned_to,
        worker_email: getUserEmail(data.assigned_user),
        worker_name: getUserFullName(data.assigned_user),
        admin_id: data.assigned_to,
        admin_email: getUserEmail(data.assigned_user),
        admin_name: getUserFullName(data.assigned_user),
        user_id: data.created_by,
        // Add notification settings as direct parameters
        newTicket: finalNotificationSettings.newTicket,
        deleted_ticket: finalNotificationSettings.deleted_ticket,
        in_work_ticket: finalNotificationSettings.in_work_ticket,
        updatetTicket: finalNotificationSettings.updatetTicket,
        solvedTicket: finalNotificationSettings.solvedTicket,
        sharedWorkflow: finalNotificationSettings.sharedWorkflow,
        sharedPrompt: finalNotificationSettings.sharedPrompt
      }
      
      console.log('Webhook payload being sent:', webhookPayload)
      
      const webhookResult = await sendNewWebhook(webhookPayload)

      console.log('Webhook result:', webhookResult)

      // Note: New webhook system doesn't return userNotified status
      // The webhook system handles notifications independently
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
      // Don't fail ticket creation if webhook fails
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

  // Send webhook for ticket update ONLY if status actually changed
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      // Determine webhook action based on what was updated
      let webhookAction: 'updated' | 'in_work' = 'updated'
      let shouldSendWebhook = true
      
      if (updates.status === 'in_progress' && currentTicket.status !== 'in_progress') {
        webhookAction = 'in_work'
        console.log('Sending webhook for ticket work started (status changed from', currentTicket.status, 'to in_progress)')
      } else if (updates.status === 'in_progress' && currentTicket.status === 'in_progress') {
        console.log('Ticket is already in_progress, skipping webhook')
        shouldSendWebhook = false
      } else {
        console.log('Sending webhook for ticket update')
      }
      
      if (!shouldSendWebhook) {
        console.log('Skipping webhook - no status change detected')
      } else {
      
      // Get user notification settings for the ticket creator
      const { getUserNotificationSettings } = await import('./new-webhook')
      const notificationSettings = await getUserNotificationSettings(data.created_by)
      
      // Fallback to default settings if none found
      const finalNotificationSettings = notificationSettings || {
        newTicket: true,
        deleted_ticket: true,
        in_work_ticket: true,
        updatetTicket: true,
        solvedTicket: true,
        sharedWorkflow: true,
        sharedPrompt: true
      }
      
      const webhookResult = await sendNewWebhook({
        action: webhookAction === 'in_work' ? 'ticket_in_work' as const : 'ticket_updated' as const,
        timestamp: new Date().toISOString(),
        ticket_id: data.id,
        ticket_title: data.title,
        ticket_urgency: data.urgency,
        ticket_status: data.status,
        ticket_deadline: data.deadline,
        ticket_date: dateTicket,
        ticket_time: timeTicket,
        creator_id: data.created_by,
        creator_email: getUserEmail(data.created_by_user),
        creator_name: getUserFullName(data.created_by_user),
        worker_id: data.assigned_to,
        worker_email: getUserEmail(data.assigned_user),
        worker_name: getUserFullName(data.assigned_user),
        admin_id: data.assigned_to,
        admin_email: getUserEmail(data.assigned_user),
        admin_name: getUserFullName(data.assigned_user),
        user_id: data.created_by,
        // Add notification settings as direct parameters
        newTicket: finalNotificationSettings.newTicket,
        deleted_ticket: finalNotificationSettings.deleted_ticket,
        in_work_ticket: finalNotificationSettings.in_work_ticket,
        updatetTicket: finalNotificationSettings.updatetTicket,
        solvedTicket: finalNotificationSettings.solvedTicket,
        sharedWorkflow: finalNotificationSettings.sharedWorkflow,
        sharedPrompt: finalNotificationSettings.sharedPrompt
      })

      console.log('Webhook result:', webhookResult)
      }
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
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
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket completion')
      
      // Get user notification settings for the ticket creator
      const { getUserNotificationSettings } = await import('./new-webhook')
      const notificationSettings = await getUserNotificationSettings(data.created_by)
      
      // Fallback to default settings if none found
      const finalNotificationSettings = notificationSettings || {
        newTicket: true,
        deleted_ticket: true,
        in_work_ticket: true,
        updatetTicket: true,
        solvedTicket: true,
        sharedWorkflow: true,
        sharedPrompt: true
      }
      
      const webhookResult = await sendNewWebhook({
        action: 'ticket_solved' as const,
        timestamp: new Date().toISOString(),
        ticket_id: data.id,
        ticket_title: data.title,
        ticket_urgency: data.urgency,
        ticket_status: 'completed',
        ticket_deadline: data.deadline,
        ticket_date: dateTicket,
        ticket_time: timeTicket,
        creator_id: data.created_by,
        creator_email: getUserEmail(data.created_by_user),
        creator_name: getUserFullName(data.created_by_user),
        worker_id: data.assigned_to,
        worker_email: getUserEmail(data.assigned_user),
        worker_name: getUserFullName(data.assigned_user),
        admin_id: data.assigned_to,
        admin_email: getUserEmail(data.assigned_user),
        admin_name: getUserFullName(data.assigned_user),
        user_id: data.created_by,
        // Add notification settings as direct parameters
        newTicket: finalNotificationSettings.newTicket,
        deleted_ticket: finalNotificationSettings.deleted_ticket,
        in_work_ticket: finalNotificationSettings.in_work_ticket,
        updatetTicket: finalNotificationSettings.updatetTicket,
        solvedTicket: finalNotificationSettings.solvedTicket,
        sharedWorkflow: finalNotificationSettings.sharedWorkflow,
        sharedPrompt: finalNotificationSettings.sharedPrompt
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
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

  // Send webhook for ticket update
  if (data) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(data.deadline)
      
      console.log('Sending webhook for ticket update')
      
      // Get user notification settings for the ticket creator
      const { getUserNotificationSettings } = await import('./new-webhook')
      const notificationSettings = await getUserNotificationSettings(data.created_by)
      
      // Fallback to default settings if none found
      const finalNotificationSettings = notificationSettings || {
        newTicket: true,
        deleted_ticket: true,
        in_work_ticket: true,
        updatetTicket: true,
        solvedTicket: true,
        sharedWorkflow: true,
        sharedPrompt: true
      }
      
      const webhookResult = await sendNewWebhook({
        action: 'ticket_updated' as const,
        timestamp: new Date().toISOString(),
        ticket_id: data.id,
        ticket_title: data.title,
        ticket_urgency: data.urgency,
        ticket_status: data.status,
        ticket_deadline: data.deadline,
        creator_id: data.created_by,
        creator_email: getUserEmail(data.created_by_user),
        creator_name: getUserFullName(data.created_by_user),
        worker_id: data.assigned_to,
        worker_email: getUserEmail(data.assigned_user),
        worker_name: getUserFullName(data.assigned_user),
        admin_id: data.assigned_to,
        admin_email: getUserEmail(data.assigned_user),
        admin_name: getUserFullName(data.assigned_user),
        user_id: data.created_by,
        // Add notification settings as direct parameters
        newTicket: finalNotificationSettings.newTicket,
        deleted_ticket: finalNotificationSettings.deleted_ticket,
        in_work_ticket: finalNotificationSettings.in_work_ticket,
        updatetTicket: finalNotificationSettings.updatetTicket,
        solvedTicket: finalNotificationSettings.solvedTicket,
        sharedWorkflow: finalNotificationSettings.sharedWorkflow,
        sharedPrompt: finalNotificationSettings.sharedPrompt
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
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
  if (ticketData) {
    try {
      const { dateTicket, timeTicket } = extractDateTime(ticketData.deadline)
      
      console.log('Sending webhook for ticket deletion')
      
      // Get user notification settings for the ticket creator
      const { getUserNotificationSettings } = await import('./new-webhook')
      const notificationSettings = await getUserNotificationSettings(ticketData.created_by)
      
      // Fallback to default settings if none found
      const finalNotificationSettings = notificationSettings || {
        newTicket: true,
        deleted_ticket: true,
        in_work_ticket: true,
        updatetTicket: true,
        solvedTicket: true,
        sharedWorkflow: true,
        sharedPrompt: true
      }
      
      const webhookResult = await sendNewWebhook({
        action: 'ticket_deleted' as const,
        timestamp: new Date().toISOString(),
        ticket_id: ticketData.id,
        ticket_title: ticketData.title,
        ticket_urgency: ticketData.urgency,
        ticket_deadline: ticketData.deadline,
        ticket_date: dateTicket,
        ticket_time: timeTicket,
        creator_id: ticketData.created_by,
        creator_email: getUserEmail(ticketData.created_by_user),
        creator_name: getUserFullName(ticketData.created_by_user),
        worker_id: ticketData.assigned_to,
        worker_email: getUserEmail(ticketData.assigned_user),
        worker_name: getUserFullName(ticketData.assigned_user),
        admin_id: ticketData.assigned_to,
        admin_email: getUserEmail(ticketData.assigned_user),
        admin_name: getUserFullName(ticketData.assigned_user),
        user_id: ticketData.created_by,
        // Add notification settings as direct parameters
        newTicket: finalNotificationSettings.newTicket,
        deleted_ticket: finalNotificationSettings.deleted_ticket,
        in_work_ticket: finalNotificationSettings.in_work_ticket,
        updatetTicket: finalNotificationSettings.updatetTicket,
        solvedTicket: finalNotificationSettings.solvedTicket,
        sharedWorkflow: finalNotificationSettings.sharedWorkflow,
        sharedPrompt: finalNotificationSettings.sharedPrompt
      })

      console.log('Webhook result:', webhookResult)
    } catch (webhookError) {
      console.error('Webhook error (non-critical):', webhookError)
    }
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
