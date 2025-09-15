import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Try to get webhook URL from database first
    let webhookUrl = ''
    let usingDatabase = false
    
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const { data: webhookSetting, error: webhookError } = await supabaseAdmin
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_url')
        .single()

      if (!webhookError && webhookSetting) {
        webhookUrl = webhookSetting.setting_value || ''
        usingDatabase = true
      }
    } catch (error) {
      console.log('Database access failed:', error)
    }

    // Fallback to environment variable if database fails
    if (!usingDatabase) {
      webhookUrl = process.env.WEBHOOK_URL || ''
    }

    return NextResponse.json({
      webhookUrl,
      isConfigured: !!webhookUrl,
      usingDatabase,
      source: usingDatabase ? 'database' : 'environment',
      message: usingDatabase ? 'Using database setting' : 'Using environment variable'
    })

  } catch (error) {
    console.error('Webhook fallback GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
    }

    // Test the webhook URL (this always works)
    try {
      const testPayload = {
        ticketAction: 'test',
        message: 'This is a test webhook from Verxyl Ticket Management.',
        timestamp: new Date().toISOString()
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        return NextResponse.json({
          error: `Webhook test failed: ${response.status} ${response.statusText}`,
          details: await response.text()
        }, { status: 400 })
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Webhook test timed out after 5 seconds' }, { status: 408 })
      }
      return NextResponse.json({ error: 'Webhook test failed', details: error.message }, { status: 400 })
    }

    // Try to save to database
    let savedToDatabase = false
    let databaseMessage = ''
    
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const { data: existingSetting, error: existingError } = await supabaseAdmin
        .from('system_settings')
        .select('id')
        .eq('setting_key', 'webhook_url')
        .single()

      if (existingSetting) {
        // Update existing setting
        const { error: updateError } = await supabaseAdmin
          .from('system_settings')
          .update({ 
            setting_value: webhookUrl,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'webhook_url')

        if (updateError) {
          databaseMessage = 'Webhook URL validated but could not save to database'
        } else {
          savedToDatabase = true
          databaseMessage = 'Webhook URL saved to database successfully!'
        }
      } else {
        databaseMessage = 'Webhook URL validated but no database setting found'
      }
    } catch (error) {
      databaseMessage = 'Webhook URL validated but database access failed'
    }

    return NextResponse.json({
      success: true,
      message: `Webhook URL validated successfully! ${databaseMessage}`,
      webhookUrl,
      savedToDatabase,
      databaseMessage
    })

  } catch (error) {
    console.error('Webhook fallback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
