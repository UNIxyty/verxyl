import { NextRequest, NextResponse } from 'next/server'
import { sendTicketWebhook } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, action } = body

    if (!ticketId || !action) {
      return NextResponse.json({ error: 'ticketId and action are required' }, { status: 400 })
    }

    console.log('Testing webhook send for ticket:', ticketId, 'action:', action)
    
    const success = await sendTicketWebhook(ticketId, action)
    
    return NextResponse.json({ 
      success,
      message: success ? 'Webhook sent successfully' : 'Webhook failed to send'
    })

  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
