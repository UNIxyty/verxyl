import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SYSTEM SETTINGS DEBUG ===')
    
    // Check if system_settings table exists and is accessible
    const { data: allSettings, error: allError } = await supabaseAdmin
      .from('system_settings')
      .select('*')

    console.log('All settings query result:', { allSettings, allError })

    // Check specifically for webhook_url setting
    const { data: webhookSetting, error: webhookError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'webhook_url')
      .single()

    console.log('Webhook setting query result:', { webhookSetting, webhookError })

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'system_settings' })
      .catch(() => ({ data: null, error: 'RPC not available' }))

    console.log('Table info result:', { tableInfo, tableError })

    return NextResponse.json({
      success: true,
      debug: {
        allSettings: {
          data: allSettings,
          error: allError,
          count: allSettings?.length || 0
        },
        webhookSetting: {
          data: webhookSetting,
          error: webhookError
        },
        tableInfo: {
          data: tableInfo,
          error: tableError
        }
      }
    })

  } catch (error) {
    console.error('Debug system settings error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
