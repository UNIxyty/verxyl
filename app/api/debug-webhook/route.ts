import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl, testPayload } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl is required' }, { status: 400 })
    }

    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Testing webhook URL:', webhookUrl)
    
    // Test the webhook URL
    const testData = testPayload || {
      type: 'test',
      message: 'This is a test webhook from Verxyl',
      timestamp: new Date().toISOString(),
      source: 'verxyl-debug'
    }

    console.log('Sending test payload:', JSON.stringify(testData, null, 2))

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const responseText = await response.text()
      
      console.log('Webhook response status:', response.status)
      console.log('Webhook response headers:', Object.fromEntries(response.headers.entries()))
      console.log('Webhook response body:', responseText)

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: responseText,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      })

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Network error',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Debug webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user's webhook settings
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, webhook_url, webhook_base_url, webhook_tickets_path, webhook_users_path')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Construct webhook URLs
    const legacyUrl = user.webhook_url
    const ticketsUrl = user.webhook_base_url && user.webhook_tickets_path 
      ? `${user.webhook_base_url}${user.webhook_tickets_path}`
      : null
    const usersUrl = user.webhook_base_url && user.webhook_users_path 
      ? `${user.webhook_base_url}${user.webhook_users_path}`
      : null

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      webhookSettings: {
        legacy: legacyUrl,
        baseUrl: user.webhook_base_url,
        ticketsPath: user.webhook_tickets_path,
        usersPath: user.webhook_users_path
      },
      constructedUrls: {
        legacy: legacyUrl,
        tickets: ticketsUrl,
        users: usersUrl
      }
    })

  } catch (error) {
    console.error('Get webhook settings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
