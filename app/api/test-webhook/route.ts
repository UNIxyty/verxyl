import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK TEST START ===')
    
    const body = await request.json()
    const { webhookUrl } = body
    
    if (!webhookUrl) {
      return NextResponse.json({
        error: 'No webhook URL provided'
      }, { status: 400 })
    }
    
    console.log('Testing webhook URL:', webhookUrl)
    
    // Test the webhook URL
    const testPayload = {
      test: true,
      message: 'This is a test webhook from Verxyl Ticket Management',
      timestamp: new Date().toISOString(),
      source: 'verxyl-test'
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })
    
    const responseText = await response.text()
    
    console.log('Webhook response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    })
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Webhook test successful',
        status: response.status,
        response: responseText
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Webhook test failed',
        status: response.status,
        statusText: response.statusText,
        response: responseText
      })
    }
    
  } catch (error) {
    console.error('=== WEBHOOK TEST ERROR ===', error)
    return NextResponse.json({
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
