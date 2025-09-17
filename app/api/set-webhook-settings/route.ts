import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SETTING WEBHOOK SETTINGS ===')

    const body = await request.json()
    const { webhook_base_url, webhook_tickets_path, webhook_users_path } = body

    if (!webhook_base_url || !webhook_tickets_path) {
      return NextResponse.json({
        success: false,
        error: 'webhook_base_url and webhook_tickets_path are required'
      }, { status: 400 })
    }

    console.log('Setting webhook settings:', {
      webhook_base_url,
      webhook_tickets_path,
      webhook_users_path
    })

    // Insert or update webhook settings
    const settings = [
      { setting_key: 'webhook_base_url', setting_value: webhook_base_url },
      { setting_key: 'webhook_tickets_path', setting_value: webhook_tickets_path },
      { setting_key: 'webhook_users_path', setting_value: webhook_users_path || '' }
    ]

    const results = []
    for (const setting of settings) {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value
        }, {
          onConflict: 'setting_key'
        })

      if (error) {
        console.error(`Error setting ${setting.setting_key}:`, error)
        results.push({ key: setting.setting_key, success: false, error: error.message })
      } else {
        console.log(`Successfully set ${setting.setting_key}:`, setting.setting_value)
        results.push({ key: setting.setting_key, success: true })
      }
    }

    const allSuccess = results.every(r => r.success)

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'Webhook settings saved successfully' : 'Some settings failed to save',
      results,
      generatedUrls: {
        ticketsUrl: `${webhook_base_url}${webhook_tickets_path}`,
        usersUrl: webhook_users_path ? `${webhook_base_url}${webhook_users_path}` : null
      }
    })

  } catch (error) {
    console.error('Set webhook settings error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
