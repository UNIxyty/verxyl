import { NextResponse, NextRequest } from 'next/server'
import { sendNewWebhook } from '@/lib/new-webhook'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing webhook manually...')
    
    // Test payload
    const testPayload = {
      action: 'newTicket',
      timestamp: new Date().toISOString(),
      user_id: 'test-user-id',
      user_email: 'test@example.com',
      user_name: 'Test User',
      ticket_id: 'test-ticket-123',
      ticket_title: 'Test Ticket',
      ticket_description: 'This is a test ticket',
      ticket_status: 'open',
      ticket_priority: 'medium',
      ticket_type: 'bug',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Test notification settings
      newTicket: true,
      deleted_ticket: true,
      in_work_ticket: true,
      updatetTicket: true,
      solvedTicket: true,
      sharedWorkflow: true,
      sharedPrompt: true
    }

    console.log('Sending test webhook with payload:', testPayload)

    const result = await sendNewWebhook(testPayload)
    
    console.log('Webhook result:', result)

    return NextResponse.json({ 
      success: true,
      result,
      testPayload,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error testing webhook manually:', error)
    return NextResponse.json({ 
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
