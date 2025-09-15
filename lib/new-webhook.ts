interface NewWebhookPayload {
  action: 'ticket_created' | 'ticket_updated' | 'ticket_solved' | 'ticket_deleted' | 'ticket_in_work' | 'role_changed'
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
    const isTicketAction = ['ticket_created', 'ticket_updated', 'ticket_solved', 'ticket_deleted', 'ticket_in_work'].includes(payload.action)
    const isUserAction = ['role_changed'].includes(payload.action)
    
    const pathKey = isTicketAction ? 'webhook_path_tickets' : isUserAction ? 'webhook_path_users' : 'webhook_path_tickets'
    
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
    
    // Add timestamp
    const fullPayload = {
      ...payload,
      timestamp: new Date().toISOString()
    }
    
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
