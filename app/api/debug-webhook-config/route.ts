import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all webhook settings
    const { data: webhookSettings, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .like('setting_key', 'webhook_%')

    if (error) {
      console.error('Error fetching webhook settings:', error)
      return NextResponse.json({ error: 'Failed to fetch webhook settings' }, { status: 500 })
    }

    console.log('Webhook settings:', webhookSettings)

    // Construct the URLs that would be used
    const webhookDomain = webhookSettings?.find(s => s.setting_key === 'webhook_domain')?.setting_value
    const webhookPathTickets = webhookSettings?.find(s => s.setting_key === 'webhook_path_tickets')?.setting_value
    const webhookPathUsers = webhookSettings?.find(s => s.setting_key === 'webhook_path_users')?.setting_value
    const webhookPathMails = webhookSettings?.find(s => s.setting_key === 'webhook_path_mails')?.setting_value
    const webhookPathProjects = webhookSettings?.find(s => s.setting_key === 'webhook_path_projects')?.setting_value
    const webhookPathInvoices = webhookSettings?.find(s => s.setting_key === 'webhook_path_invoices')?.setting_value
    const webhookPathNotifications = webhookSettings?.find(s => s.setting_key === 'webhook_path_notifications')?.setting_value

    const constructedUrls = {
      tickets: webhookDomain && webhookPathTickets ? `${webhookDomain}${webhookPathTickets}` : null,
      users: webhookDomain && webhookPathUsers ? `${webhookDomain}${webhookPathUsers}` : null,
      mails: webhookDomain && webhookPathMails ? `${webhookDomain}${webhookPathMails}` : null,
      projects: webhookDomain && webhookPathProjects ? `${webhookDomain}${webhookPathProjects}` : null,
      invoices: webhookDomain && webhookPathInvoices ? `${webhookDomain}${webhookPathInvoices}` : null,
      notifications: webhookDomain && webhookPathNotifications ? `${webhookDomain}${webhookPathNotifications}` : null
    }

    return NextResponse.json({ 
      webhookSettings,
      constructedUrls,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in debug webhook config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
