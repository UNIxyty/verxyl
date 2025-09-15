import { NextResponse } from 'next/server'
import { sendWebhook } from '@/lib/webhook'

export async function POST() {
  try {
    console.log('=== TESTING WEBHOOK ===')
    
    // Test webhook with sample data
    const testData = {
      action: 'in_work' as const,
      ticket_id: 'test-ticket-123',
      ticket_title: 'Test Ticket - Start Work Webhook',
      urgency: 'medium' as const,
      dateTicket: '2025-01-17',
      timeTicket: '12:00',
      creatorName: 'Test User',
      workerName: 'Test Worker',
      creatorEmail: 'test@example.com',
      workerEmail: 'worker@example.com',
      user_id: 'test-user-id',
      user_name: 'Test User',
      admin_id: 'test-admin-id'
    }
    
    console.log('Sending test webhook with data:', testData)
    
    const result = await sendWebhook(testData)
    
    console.log('Webhook result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook test completed',
      webhookResult: result,
      testData
    })
    
  } catch (error) {
    console.error('=== WEBHOOK TEST ERROR ===', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
