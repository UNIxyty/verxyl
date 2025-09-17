import { NextRequest, NextResponse } from 'next/server'
import { deleteTicket } from '@/lib/database'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE TICKET API ===')
    
    const { id } = params
    
    console.log('Deleting ticket:', id)
    
    const success = await deleteTicket(id)
    
    if (!success) {
      console.error('Failed to delete ticket')
      return NextResponse.json({
        error: 'Failed to delete ticket'
      }, { status: 500 })
    }
    
    console.log('Ticket deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    })
    
  } catch (error) {
    console.error('=== DELETE TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
