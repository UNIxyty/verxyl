import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Check if current user is admin
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || currentUserData.role !== 'admin' || currentUserData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get webhook settings
    const { data: domainSetting, error: domainError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_domain')
      .single()

    const { data: pathSetting, error: pathError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_path')
      .single()

    const webhookDomain = domainSetting?.setting_value || ''
    const webhookPath = pathSetting?.setting_value || ''

    return NextResponse.json({
      success: true,
      webhook_domain: webhookDomain,
      webhook_path: webhookPath
    })

  } catch (error) {
    console.error('Error fetching new webhook settings:', error)
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

    // Check if current user is admin
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || currentUserData.role !== 'admin' || currentUserData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { webhook_domain, webhook_path } = await request.json()

    // Validate inputs
    if (!webhook_domain || typeof webhook_domain !== 'string') {
      return NextResponse.json({ error: 'Webhook domain is required' }, { status: 400 })
    }

    if (!webhook_path || typeof webhook_path !== 'string') {
      return NextResponse.json({ error: 'Webhook path is required' }, { status: 400 })
    }

    // Validate domain format
    try {
      const testUrl = `${webhook_domain}${webhook_path}`
      new URL(testUrl)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 })
    }

    // Upsert webhook domain setting
    const { error: domainError } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        setting_key: 'webhook_domain',
        setting_value: webhook_domain,
        setting_description: 'Webhook domain for new webhook system',
        updated_at: new Date().toISOString()
      })

    if (domainError) {
      console.error('Error saving webhook domain:', domainError)
      return NextResponse.json({ error: 'Failed to save webhook domain' }, { status: 500 })
    }

    // Upsert webhook path setting
    const { error: pathError } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        setting_key: 'webhook_path',
        setting_value: webhook_path,
        setting_description: 'Webhook path for new webhook system',
        updated_at: new Date().toISOString()
      })

    if (pathError) {
      console.error('Error saving webhook path:', pathError)
      return NextResponse.json({ error: 'Failed to save webhook path' }, { status: 500 })
    }

    // Test webhook
    try {
      const { sendNewWebhook } = await import('@/lib/new-webhook')
      const testResult = await sendNewWebhook({
        action: 'ticket_created',
        timestamp: new Date().toISOString(),
        ticket_id: 'test-ticket-id',
        ticket_title: 'Test Webhook Configuration',
        admin_id: user.id,
        admin_email: user.email || '',
        admin_name: 'Admin User',
        user_id: user.id,
        user_email: user.email || '',
        user_name: 'Admin User'
      })

      if (!testResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Webhook settings saved but test failed',
          test_error: testResult.error
        })
      }
    } catch (testError) {
      console.error('Webhook test error:', testError)
    }

    return NextResponse.json({
      success: true,
      message: 'New webhook settings saved and tested successfully'
    })

  } catch (error) {
    console.error('Error saving new webhook settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
