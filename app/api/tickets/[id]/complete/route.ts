import { NextRequest, NextResponse } from 'next/server'
import { completeTicket } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== COMPLETE TICKET API ===')
    
    const { id } = params
    const solutionData = await request.json()
    
    console.log('Completing ticket:', id, 'with solution:', solutionData)
    
    const ticket = await completeTicket(id, solutionData)
    
    if (!ticket) {
      console.error('Failed to complete ticket')
      return NextResponse.json({
        error: 'Failed to complete ticket'
      }, { status: 500 })
    }
    
    console.log('Ticket completed successfully:', ticket)
    
    return NextResponse.json({
      success: true,
      ticket: ticket
    })
    
  } catch (error) {
    console.error('=== COMPLETE TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
