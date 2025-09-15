import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== INITIALIZING WEBHOOK SETTING ===')
    
    // Check if webhook setting already exists
    const { data: existingSetting, error: checkError } = await supabaseAdmin
      .from('system_settings')
      .select('id, setting_key, setting_value')
      .eq('setting_key', 'webhook_url')
      .single()

    console.log('Existing setting check:', { existingSetting, checkError })

    if (existingSetting) {
      return NextResponse.json({
        success: true,
        message: 'Webhook setting already exists',
        setting: existingSetting
      })
    }

    // Get the first admin user to use as creator
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('approval_status', 'approved')
      .limit(1)
      .single()

    console.log('Admin user lookup:', { adminUser, adminError })

    const createdBy = adminUser?.id || null

    // Insert the webhook setting
    const { data: newSetting, error: insertError } = await supabaseAdmin
      .from('system_settings')
      .insert({
        setting_key: 'webhook_url',
        setting_value: '',
        setting_description: 'Webhook URL for ticket notifications',
        setting_type: 'url',
        created_by: createdBy,
        updated_by: createdBy
      })
      .select()

    console.log('Insert result:', { newSetting, insertError })

    if (insertError) {
      console.error('Error inserting webhook setting:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create webhook setting',
        details: insertError.message,
        code: insertError.code
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook setting created successfully',
      setting: newSetting
    })

  } catch (error) {
    console.error('Init webhook setting error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
