import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE STATUS CHECK ===')
    
    // Test 1: Check if system_settings table exists by trying to query it
    let tableExists = false
    let tableError = null
    let settingsCount = 0
    
    try {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('id, setting_key, setting_value')
        .limit(5)
      
      if (error) {
        tableError = error
        console.log('Table query failed:', error.message)
      } else {
        tableExists = true
        settingsCount = data?.length || 0
        console.log('Table query successful, found', settingsCount, 'settings')
      }
    } catch (err) {
      tableError = err
      console.log('Table query exception:', err)
    }

    // Test 2: Check for webhook_url specifically
    let webhookSetting = null
    let webhookError = null
    
    if (tableExists) {
      try {
        const { data, error } = await supabaseAdmin
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'webhook_url')
          .single()
        
        if (error && error.code !== 'PGRST116') {
          webhookError = error
        } else {
          webhookSetting = data
        }
      } catch (err) {
        webhookError = err
      }
    }

    // Test 3: Check environment variable as fallback
    const envWebhookUrl = process.env.WEBHOOK_URL || ''
    
    return NextResponse.json({
      success: true,
      database: {
        tableExists,
        settingsCount,
        tableError: tableError ? {
          message: (tableError as any).message || 'Unknown error',
          code: (tableError as any).code || 'UNKNOWN',
          details: (tableError as any).details || null
        } : null,
        webhookSetting,
        webhookError: webhookError ? {
          message: (webhookError as any).message || 'Unknown error',
          code: (webhookError as any).code || 'UNKNOWN'
        } : null
      },
      environment: {
        hasWebhookUrl: !!envWebhookUrl,
        webhookUrlLength: envWebhookUrl.length
      },
      recommendation: tableExists 
        ? (webhookSetting ? 'Database table exists and webhook setting found' : 'Database table exists but no webhook setting found')
        : 'system_settings table does not exist - run the SQL script to create it'
    })

  } catch (error) {
    console.error('Database status check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
