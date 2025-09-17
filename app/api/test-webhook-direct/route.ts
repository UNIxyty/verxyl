import { NextRequest, NextResponse } from 'next/server'
import { sendWebhook } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING WEBHOOK DIRECTLY ===')

    const webhookUrl = 'https://n8n.fluntstudios.com/webhook/tickets'
    const testPayload = {
      action: 'workflowShared',
      ticket_id: null,
      ticket_title: 'Test Workflow',
      ticket_urgency: null,
      ticket_deadline: null,
      ticket_date: null,
      ticket_time: null,
      creator_id: 'test-user-id',
      creator_email: 'test@example.com',
      creator_name: 'Test User',
      worker_id: 'test-recipient-id',
      worker_email: 'recipient@example.com',
      worker_name: 'Test Recipient',
      shared_from: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      },
      shared_to: {
        id: 'test-recipient-id',
        email: 'recipient@example.com',
        name: 'Test Recipient'
      },
      workflow_prompt_title: 'Test Workflow',
      date_of_share: new Date().toISOString()
    }

    console.log('Testing webhook URL:', webhookUrl)
    console.log('Test payload:', JSON.stringify(testPayload, null, 2))

    const result = await sendWebhook(webhookUrl, testPayload)

    return NextResponse.json({
      success: result,
      message: result ? 'Webhook sent successfully!' : 'Webhook failed to send',
      webhookUrl,
      payload: testPayload
    })

  } catch (error) {
    console.error('Direct webhook test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
