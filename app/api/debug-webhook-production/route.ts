import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG WEBHOOK PRODUCTION SETTINGS ===')

    // Fetch webhook settings
    const { data: webhookSettings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['webhook_base_url', 'webhook_tickets_path', 'webhook_users_path'])

    if (settingsError) {
      return NextResponse.json({
        error: 'Error fetching webhook settings',
        details: settingsError.message,
        code: settingsError.code
      }, { status: 500 })
    }

    // Parse webhook settings
    const settings: any = {}
    webhookSettings?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value
    })

    const hasBaseUrl = !!(settings.webhook_base_url && settings.webhook_base_url.trim() !== '')
    const hasTicketsPath = !!(settings.webhook_tickets_path && settings.webhook_tickets_path.trim() !== '')
    const hasUsersPath = !!(settings.webhook_users_path && settings.webhook_users_path.trim() !== '')

    const ticketsUrl = hasBaseUrl && hasTicketsPath 
      ? `${settings.webhook_base_url}${settings.webhook_tickets_path}`
      : null

    const usersUrl = hasBaseUrl && hasUsersPath
      ? `${settings.webhook_base_url}${settings.webhook_users_path}`
      : null

    return NextResponse.json({
      message: 'Webhook settings debug complete',
      environment: process.env.NODE_ENV,
      settings: {
        webhook_base_url: settings.webhook_base_url || 'NOT SET',
        webhook_tickets_path: settings.webhook_tickets_path || 'NOT SET',
        webhook_users_path: settings.webhook_users_path || 'NOT SET'
      },
      validation: {
        hasBaseUrl,
        hasTicketsPath,
        hasUsersPath
      },
      generatedUrls: {
        ticketsUrl,
        usersUrl
      },
      allSettings: webhookSettings
    })

  } catch (error) {
    console.error('Debug webhook production error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
