import { NextRequest, NextResponse } from 'next/server'
import { updateTicket } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE TICKET API ===')

    const { id } = params
    const updateData = await request.json()
    
    console.log('Updating ticket:', id, 'with data:', updateData)

    const ticket = await updateTicket(id, updateData)

    if (!ticket) {
      console.error('Failed to update ticket')
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Unexpected error in update ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
