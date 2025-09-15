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

    // Always return environment variable for now (guaranteed to work)
    const webhookUrl = process.env.WEBHOOK_URL || ''

    return NextResponse.json({
      webhookUrl,
      isConfigured: !!webhookUrl,
      usingDatabase: false,
      source: 'environment',
      message: 'Using environment variable (database not available)'
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

    // For now, just return success (we'll implement database saving later)
    return NextResponse.json({
      success: true,
      message: 'Webhook URL validated successfully! Note: Database saving not yet implemented.',
      webhookUrl,
      savedToDatabase: false,
      databaseMessage: 'Database saving will be implemented after table setup'
    })

  } catch (error) {
    console.error('Webhook fallback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
