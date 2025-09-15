import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { webhookUrl } = await request.json()

    console.log('=== WEBHOOK SAVE DEBUG ===')
    console.log('User ID:', user.id)
    console.log('Webhook URL:', webhookUrl)
    console.log('User role:', userData.role)
    console.log('Approval status:', userData.approval_status)

    // Check if system_settings table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .limit(1)

    console.log('Table check result:', { tableCheck, tableError })

    if (tableError) {
      console.error('Table access error:', tableError)
      return NextResponse.json({
        success: false,
        error: 'system_settings table not accessible',
        details: tableError.message,
        code: tableError.code
      })
    }

    // Check existing webhook setting
    const { data: existingSetting, error: existingError } = await supabaseAdmin
      .from('system_settings')
      .select('id, setting_value, updated_at')
      .eq('setting_key', 'webhook_url')
      .single()

    console.log('Existing setting check:', { existingSetting, existingError })

    if (existingSetting) {
      console.log('Updating existing setting...')
      // Update existing setting
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('system_settings')
        .update({ 
          setting_value: webhookUrl,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'webhook_url')
        .select()

      console.log('Update result:', { updateResult, updateError })

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update webhook setting',
          details: updateError.message,
          code: updateError.code
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook setting updated successfully',
        result: updateResult
      })

    } else {
      console.log('Inserting new setting...')
      // Insert new setting
      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          setting_key: 'webhook_url',
          setting_value: webhookUrl,
          setting_description: 'Webhook URL for ticket notifications',
          setting_type: 'url',
          created_by: user.id,
          updated_by: user.id
        })
        .select()

      console.log('Insert result:', { insertResult, insertError })

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Failed to insert webhook setting',
          details: insertError.message,
          code: insertError.code
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook setting created successfully',
        result: insertResult
      })
    }

  } catch (error) {
    console.error('Debug webhook save error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
