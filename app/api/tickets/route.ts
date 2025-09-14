import { NextRequest, NextResponse } from 'next/server'
import { createTicket } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API: Creating ticket with data:', body)
    
    const ticket = await createTicket(body)
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }
    
    console.log('API: Ticket created successfully:', ticket)
    return NextResponse.json(ticket)
  } catch (error) {
    console.error('API: Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Tickets API endpoint' })
}
