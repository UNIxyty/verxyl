import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== SIMPLE ADMIN SETTINGS SETUP ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const results = []
    
    // Try to insert the webhook URL setting directly
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'webhook_url',
          setting_value: '',
          description: 'Webhook URL for sending ticket notifications'
        }, {
          onConflict: 'setting_key'
        })
        .select()
      
      results.push({
        step: 'insert_webhook_url',
        result: insertError ? 'ERROR' : 'SUCCESS',
        data: insertData,
        error: insertError?.message
      })
      
      console.log('Insert result:', { data: insertData, error: insertError })
    } catch (error) {
      results.push({
        step: 'insert_webhook_url',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error('Insert error:', error)
    }
    
    // Test reading the webhook URL
    try {
      const { data: testData, error: testError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_url')
        .single()
      
      results.push({
        step: 'test_read',
        result: testError ? 'ERROR' : 'SUCCESS',
        data: testData,
        error: testError?.message
      })
      
      console.log('Test read result:', { data: testData, error: testError })
    } catch (error) {
      results.push({
        step: 'test_read',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error('Test read error:', error)
    }
    
    console.log('Setup results:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Simple admin settings setup completed',
      results
    })
    
  } catch (error) {
    console.error('=== SETUP ERROR ===', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
