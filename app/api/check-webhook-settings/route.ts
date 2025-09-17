import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECKING WEBHOOK SETTINGS ===')

    // Check if system_settings table exists and has webhook settings
    const { data: webhookSettings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .in('setting_key', ['webhook_base_url', 'webhook_tickets_path', 'webhook_users_path'])

    if (settingsError) {
      console.error('Error fetching webhook settings:', settingsError)
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: settingsError.message,
        code: settingsError.code
      }, { status: 500 })
    }

    console.log('Webhook settings found:', webhookSettings)

    // Check if any settings exist
    const hasSettings = webhookSettings && webhookSettings.length > 0

    if (!hasSettings) {
      return NextResponse.json({
        success: false,
        message: 'No webhook settings found in system_settings table',
        action: 'Configure webhook settings in Admin Settings → System Settings',
        webhookSettings: []
      })
    }

    // Parse settings
    const settings: any = {}
    webhookSettings.forEach(setting => {
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
      success: true,
      message: 'Webhook settings found',
      settings: {
        webhook_base_url: settings.webhook_base_url || 'NOT SET',
        webhook_tickets_path: settings.webhook_tickets_path || 'NOT SET',
        webhook_users_path: settings.webhook_users_path || 'NOT SET'
      },
      validation: {
        hasBaseUrl,
        hasTicketsPath,
        hasUsersPath,
        isConfigured: hasBaseUrl && hasTicketsPath
      },
      generatedUrls: {
        ticketsUrl,
        usersUrl
      },
      rawSettings: webhookSettings
    })

  } catch (error) {
    console.error('Check webhook settings error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
