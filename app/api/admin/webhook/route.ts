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

    // Return current webhook URL from environment
    const webhookUrl = process.env.WEBHOOK_URL || ''
    
    return NextResponse.json({
      webhookUrl,
      isConfigured: !!webhookUrl
    })

  } catch (error) {
    console.error('Webhook GET error:', error)
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

    // Validate webhook URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
    }

    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 })
    }

    // Test the webhook URL
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'Webhook URL test from Verxyl Ticket System',
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!testResponse.ok) {
        return NextResponse.json({ 
          error: 'Webhook test failed', 
          details: `HTTP ${testResponse.status}: ${testResponse.statusText}` 
        }, { status: 400 })
      }

    } catch (testError) {
      return NextResponse.json({ 
        error: 'Webhook test failed', 
        details: testError instanceof Error ? testError.message : 'Unknown error' 
      }, { status: 400 })
    }

    // Note: In a real application, you would update the environment variable here
    // For now, we'll just return success since environment variables are read-only at runtime
    return NextResponse.json({
      success: true,
      message: 'Webhook URL validated successfully. Note: To persist changes, update the WEBHOOK_URL environment variable in your deployment platform.',
      webhookUrl
    })

  } catch (error) {
    console.error('Webhook POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
