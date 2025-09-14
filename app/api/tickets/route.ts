import { NextRequest, NextResponse } from 'next/server'
import { createTicket } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting ticket creation...')
    const body = await request.json()
    console.log('API: Creating ticket with data:', body)
    
    // Validate required fields
    if (!body.title || !body.urgency || !body.details || !body.assigned_to || !body.created_by) {
      console.error('API: Missing required fields:', {
        title: !!body.title,
        urgency: !!body.urgency,
        details: !!body.details,
        assigned_to: !!body.assigned_to,
        created_by: !!body.created_by
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log('API: Calling createTicket function...')
    const ticket = await createTicket(body)
    
    if (!ticket) {
      console.error('API: createTicket returned null')
      return NextResponse.json(
        { error: 'Failed to create ticket - no data returned' },
        { status: 500 }
      )
    }
    
    console.log('API: Ticket created successfully:', ticket)
    return NextResponse.json(ticket)
  } catch (error) {
    console.error('API: Error creating ticket:', error)
    console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('API: Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Tickets API endpoint' })
}
