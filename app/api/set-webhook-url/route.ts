import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    console.log('=== SET WEBHOOK URL ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const body = await request.json()
    const { webhook_url } = body
    
    if (!webhook_url) {
      return NextResponse.json({
        error: 'webhook_url is required'
      }, { status: 400 })
    }
    
    // Update or insert the webhook URL
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: 'webhook_url',
        setting_value: webhook_url,
        description: 'Webhook URL for sending ticket notifications'
      }, {
        onConflict: 'setting_key'
      })
      .select()
    
    if (error) {
      console.error('Error setting webhook URL:', error)
      return NextResponse.json({
        error: 'Failed to set webhook URL',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Webhook URL set successfully:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook URL set successfully',
      data
    })
    
  } catch (error) {
    console.error('=== SET WEBHOOK URL ERROR ===', error)
    return NextResponse.json({
      error: 'Failed to set webhook URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('=== GET WEBHOOK URL ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    // Get the webhook URL
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_url')
      .single()
    
    if (error) {
      console.error('Error getting webhook URL:', error)
      return NextResponse.json({
        error: 'Failed to get webhook URL',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Webhook URL retrieved:', data)
    
    return NextResponse.json({
      success: true,
      webhook_url: data?.setting_value || '',
      data
    })
    
  } catch (error) {
    console.error('=== GET WEBHOOK URL ERROR ===', error)
    return NextResponse.json({
      error: 'Failed to get webhook URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
