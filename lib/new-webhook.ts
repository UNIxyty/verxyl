interface NewWebhookPayload {
  action: 'ticket_created' | 'ticket_updated' | 'ticket_solved' | 'ticket_deleted' | 'ticket_in_work' | 'role_changed' | 'new_mail' | 'project_created' | 'project_updated' | 'project_completed' | 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'notification_settings_changed' | 'sharedWorkflow' | 'sharedPrompt'
  timestamp: string
  
  // Common fields
  admin_id?: string
  admin_email?: string
  admin_name?: string
  
  // Ticket fields (when applicable)
  ticket_id?: string
  ticket_title?: string
  ticket_urgency?: 'low' | 'medium' | 'high' | 'critical'
  ticket_status?: 'new' | 'in_progress' | 'completed'
  ticket_deadline?: string
  ticket_date?: string | null
  ticket_time?: string | null
  ticket_details?: string
  
  // Mail fields
  mail_id?: string
  mail_subject?: string
  sender_id?: string
  sender_email?: string
  sender_name?: string
  recipient_id?: string
  recipient_email?: string
  recipient_name?: string
  
  // Project fields
  project_id?: string
  project_title?: string
  project_status?: string
  project_deadline?: string
  project_budget?: number
  
  // Invoice fields
  invoice_id?: string
  invoice_number?: string
  invoice_title?: string
  invoice_amount?: number
  invoice_currency?: string
  invoice_status?: string
  client_id?: string
  client_email?: string
  client_name?: string
  
  // User fields
  user_id?: string
  user_email?: string
  user_name?: string
  
  // Role change specific fields
  roleChanged?: boolean
  prevRole?: string
  currentRole?: string
  
  // Worker/Assignee fields
  worker_id?: string
  worker_email?: string
  worker_name?: string
  
  // Creator fields
  creator_id?: string
  creator_email?: string
  creator_name?: string
  
  // Notification settings fields
  notification_type?: string
  notification_enabled?: boolean
  
  // Notification body with settings
  notificationBody?: {
    newTicket?: boolean
    deleted_ticket?: boolean
    in_work_ticket?: boolean
    updatetTicket?: boolean
    solvedTicket?: boolean
    sharedWorkflow?: boolean
    sharedPrompt?: boolean
  }
  
  // Direct notification parameters for ticket webhooks
  newTicket?: boolean
  deleted_ticket?: boolean
  in_work_ticket?: boolean
  updatetTicket?: boolean
  solvedTicket?: boolean
  sharedWorkflow?: boolean
  sharedPrompt?: boolean
  
  // Notifications object for user webhooks
  notifications?: {
    rolechange?: boolean
  }
  
  // Sharing-related fields
  backup_id?: string
  backup_title?: string
  backup_type?: 'ai_prompt' | 'n8n_workflow'
  shared_by_id?: string
  shared_by_email?: string
  shared_by_name?: string
  access_role?: 'viewer' | 'editor'
}

// Helper function to get user notification settings
export async function getUserNotificationSettings(userId: string): Promise<{
  newTicket: boolean
  deleted_ticket: boolean
  in_work_ticket: boolean
  updatetTicket: boolean
  solvedTicket: boolean
  sharedWorkflow: boolean
  sharedPrompt: boolean
} | null> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    
    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user notification settings:', error)
      return null
    }
    
    // Return default settings if none exist
    return settings || {
      newTicket: true,
      deleted_ticket: true,
      in_work_ticket: true,
      updatetTicket: true,
      solvedTicket: true,
      sharedWorkflow: true,
      sharedPrompt: true
    }
  } catch (error) {
    console.error('Error in getUserNotificationSettings:', error)
    return null
  }
}

export async function sendNewWebhook(payload: NewWebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Get webhook settings from database
    const { supabaseAdmin } = await import('./supabase')
    
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_domain')
      .single()
    
    // Determine which path to use based on action type
    const isTicketAction = ['ticket_created', 'ticket_updated', 'ticket_solved', 'ticket_deleted', 'ticket_in_work', 'sharedWorkflow', 'sharedPrompt'].includes(payload.action)
    const isUserAction = ['role_changed'].includes(payload.action)
    const isMailAction = ['new_mail'].includes(payload.action)
    const isProjectAction = ['project_created', 'project_updated', 'project_completed'].includes(payload.action)
    const isInvoiceAction = ['invoice_created', 'invoice_sent', 'invoice_paid'].includes(payload.action)
    const isNotificationAction = ['notification_settings_changed'].includes(payload.action)
    
    let pathKey = 'webhook_path_tickets' // default
    if (isTicketAction) pathKey = 'webhook_path_tickets'
    else if (isUserAction) pathKey = 'webhook_path_users'
    else if (isMailAction) pathKey = 'webhook_path_mails'
    else if (isProjectAction) pathKey = 'webhook_path_projects'
    else if (isInvoiceAction) pathKey = 'webhook_path_invoices'
    else if (isNotificationAction) pathKey = 'webhook_path_notifications'
    
    const { data: pathSetting, error: pathError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', pathKey)
      .single()
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching webhook domain:', settingsError)
      return { success: false, error: 'Failed to fetch webhook domain' }
    }
    
    if (pathError && pathError.code !== 'PGRST116') {
      console.error('Error fetching webhook path:', pathError)
      return { success: false, error: 'Failed to fetch webhook path' }
    }
    
    const webhookDomain = settings?.setting_value
    const webhookPath = pathSetting?.setting_value
    
    if (!webhookDomain) {
      console.log('No webhook domain configured')
      return { success: false, error: 'Webhook domain not configured' }
    }
    
    if (!webhookPath) {
      console.log('No webhook path configured')
      return { success: false, error: 'Webhook path not configured' }
    }
    
    // Construct full webhook URL
    const webhookUrl = `${webhookDomain}${webhookPath}`
    
    console.log('Sending new webhook to:', webhookUrl)
    console.log('Webhook payload:', payload)
    
    // Add timestamp and notification settings if user_id is available
    const fullPayload = {
      ...payload,
      timestamp: new Date().toISOString()
    }
    
    // Add notification settings based on webhook type (only if not already provided)
    if (payload.user_id && !payload.notifications && !payload.newTicket) {
      const notificationSettings = await getUserNotificationSettings(payload.user_id)
      if (notificationSettings) {
        if (isUserAction) {
          // For user webhooks (role_changed), add notifications object
          fullPayload.notifications = {
            rolechange: true // You can make this configurable based on notification settings
          }
        } else if (isTicketAction) {
          // For ticket webhooks, add direct notification parameters
          fullPayload.newTicket = notificationSettings.newTicket
          fullPayload.deleted_ticket = notificationSettings.deleted_ticket
          fullPayload.in_work_ticket = notificationSettings.in_work_ticket
          fullPayload.updatetTicket = notificationSettings.updatetTicket
          fullPayload.solvedTicket = notificationSettings.solvedTicket
          fullPayload.sharedWorkflow = notificationSettings.sharedWorkflow
          fullPayload.sharedPrompt = notificationSettings.sharedPrompt
        }
      }
    }
    
    console.log('Full payload being sent:', fullPayload)
    
    // Send webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Verxyl-Ticket-System/1.0'
      },
      body: JSON.stringify(fullPayload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook failed:', response.status, response.statusText, errorText)
      return { success: false, error: `Webhook failed: ${response.status} ${response.statusText}` }
    }
    
    console.log('New webhook sent successfully')
    return { success: true }
    
  } catch (error) {
    console.error('Error sending new webhook:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
