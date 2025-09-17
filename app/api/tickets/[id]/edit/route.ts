import { NextRequest, NextResponse } from 'next/server'
import { editTicket } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== EDIT TICKET API ===')
    
    const { id } = params
    const updateData = await request.json()
    
    console.log('Editing ticket:', id, 'with data:', updateData)
    
    const ticket = await editTicket(id, updateData)
    
    if (!ticket) {
      console.error('Failed to edit ticket')
      return NextResponse.json({
        error: 'Failed to edit ticket'
      }, { status: 500 })
    }
    
    console.log('Ticket edited successfully:', ticket)
    
    return NextResponse.json({
      success: true,
      ticket: ticket
    })
    
  } catch (error) {
    console.error('=== EDIT TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
