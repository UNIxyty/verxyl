import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl is required' }, { status: 400 })
    }

    console.log('Testing n8n webhook:', webhookUrl)

    // Test payload for n8n
    const testPayload = {
      type: 'test',
      message: 'Test webhook from Verxyl',
      timestamp: new Date().toISOString(),
      data: {
        ticket_id: 'test-123',
        action: 'created',
        title: 'Test Ticket'
      }
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })

      const responseText = await response.text()
      
      console.log('n8n webhook response status:', response.status)
      console.log('n8n webhook response body:', responseText)

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        troubleshooting: {
          is404: response.status === 404,
          suggestions: response.status === 404 ? [
            '1. Activate your n8n workflow (toggle in top-right corner)',
            '2. Use production URL (not test URL)',
            '3. Check webhook path matches n8n configuration',
            '4. Ensure webhook node accepts POST requests'
          ] : []
        }
      })

    } catch (fetchError) {
      console.error('n8n webhook fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Network error',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        troubleshooting: {
          suggestions: [
            '1. Check if n8n server is accessible',
            '2. Verify webhook URL is correct',
            '3. Check network connectivity'
          ]
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('n8n webhook test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
