import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATING WEBHOOK SETTING DIRECTLY ===')
    
    // Use service role to bypass RLS and create the setting directly
    const { data: result, error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        setting_key: 'webhook_url',
        setting_value: '',
        setting_description: 'Webhook URL for ticket notifications',
        setting_type: 'url',
        created_by: null,
        updated_by: null
      }, {
        onConflict: 'setting_key'
      })
      .select()

    console.log('Direct insert result:', { result, error })

    if (error) {
      console.error('Error creating webhook setting:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create webhook setting',
        details: error.message,
        code: error.code
      })
    }

    // Verify it was created
    const { data: verify, error: verifyError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'webhook_url')
      .single()

    console.log('Verification result:', { verify, verifyError })

    return NextResponse.json({
      success: true,
      message: 'Webhook setting created successfully',
      setting: result,
      verification: verify
    })

  } catch (error) {
    console.error('Create webhook setting error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
