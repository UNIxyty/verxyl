interface WebhookPayload {
  ticketAction: 'created' | 'updated' | 'solved' | 'deleted'
  ticket_id: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  dateTicket: string | null
  timeTicket: string | null
  creatorName: string
  workerName: string
  creatorEmail: string
  workerEmail: string
}

export async function sendWebhook(payload: WebhookPayload): Promise<{ success: boolean; userNotified?: boolean }> {
  try {
    // Get webhook URL from environment variable or database
    let webhookUrl = process.env.WEBHOOK_URL
    
    // If no environment variable, try to get from database (admin settings)
    if (!webhookUrl) {
      try {
        const { supabase } = await import('./supabase')
        const { data: settings } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'webhook_url')
          .single()
        
        webhookUrl = settings?.setting_value
      } catch (error) {
        console.log('Could not fetch webhook URL from database:', error)
      }
    }

    if (!webhookUrl || !isValidUrl(webhookUrl)) {
      console.log('No valid webhook URL configured')
      return { success: false }
    }

    console.log('Sending webhook to:', webhookUrl, 'with payload:', payload)

    // Send webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('Webhook failed:', response.status, response.statusText)
      return { success: false }
    }

    console.log('Webhook sent successfully')

    // Check response for user notification status
    try {
      const responseText = await response.text()
      console.log('Webhook response:', responseText)
      
      // Check if response contains "User has been notified"
      const userNotified = responseText.toLowerCase().includes('user has been notified')
      
      return { success: true, userNotified }
    } catch (parseError) {
      console.error('Error parsing webhook response:', parseError)
      return { success: true, userNotified: false }
    }
  } catch (error) {
    console.error('Error sending webhook:', error)
    return { success: false }
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Helper function to extract date and time from deadline string
export function extractDateTime(deadline: string | null): { dateTicket: string | null, timeTicket: string | null } {
  if (!deadline) {
    return { dateTicket: null, timeTicket: null }
  }

  try {
    const date = new Date(deadline)
    const dateTicket = date.toISOString().split('T')[0] // YYYY-MM-DD format
    const timeTicket = date.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format
    return { dateTicket, timeTicket }
  } catch (error) {
    console.error('Error parsing deadline:', error)
    return { dateTicket: null, timeTicket: null }
  }
}

// Helper function to get user full name
export function getUserFullName(user: any): string {
  if (!user) return 'Unknown User'
  
  // Handle different user data structures
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  if (user.full_name) {
    return user.full_name
  }
  if (user.email) {
    return user.email
  }
  
  return 'Unknown User'
}

// Helper function to get user email
export function getUserEmail(user: any): string {
  if (!user) return 'unknown@example.com'
  
  // Handle different user data structures
  if (user.email) {
    return user.email
  }
  
  return 'unknown@example.com'
}
