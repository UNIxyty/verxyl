import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== WEBHOOK STATUS CHECK ===')
    
    const status = {
      timestamp: new Date().toISOString(),
      webhookUrl: {
        fromEnv: process.env.WEBHOOK_URL || null,
        fromDatabase: null,
        final: null
      },
      supabase: {
        configured: isSupabaseConfigured()
      }
    }
    
    // Check environment variable
    if (process.env.WEBHOOK_URL) {
      status.webhookUrl.final = process.env.WEBHOOK_URL
      console.log('Webhook URL found in environment:', process.env.WEBHOOK_URL)
    }
    
    // Check database if no env var
    if (!status.webhookUrl.final && isSupabaseConfigured()) {
      try {
        const { data: settings, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'webhook_url')
          .single()
        
        if (!error && settings?.setting_value) {
          status.webhookUrl.fromDatabase = settings.setting_value
          status.webhookUrl.final = settings.setting_value
          console.log('Webhook URL found in database:', settings.setting_value)
        }
      } catch (error) {
        console.log('Could not fetch webhook URL from database:', error)
      }
    }
    
    // Final status
    status.webhookConfigured = !!status.webhookUrl.final
    
    console.log('Webhook status:', status)
    
    return NextResponse.json(status)
    
  } catch (error) {
    console.error('=== WEBHOOK STATUS ERROR ===', error)
    return NextResponse.json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
