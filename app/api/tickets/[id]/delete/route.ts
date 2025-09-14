import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendWebhook, extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE TICKET API ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const { id } = params
    
    console.log('Deleting ticket:', id)
    
    // First get ticket data for webhook
    const { data: ticketData, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching ticket for deletion:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch ticket for deletion',
        details: fetchError.message
      }, { status: 500 })
    }
    
    console.log('Ticket data fetched successfully:', ticketData)
    
    // Delete the ticket
    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting ticket:', error)
      return NextResponse.json({
        error: 'Failed to delete ticket',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Ticket deleted successfully')
    
    // Send webhook for ticket deletion
    if (ticketData) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(ticketData.deadline)
        
        console.log('Sending webhook for ticket deletion')
        const webhookResult = await sendWebhook({
          ticketAction: 'deleted',
          ticket_id: ticketData.id,
          ticket_title: ticketData.title,
          urgency: ticketData.urgency,
          dateTicket,
          timeTicket,
          creatorName: getUserFullName(ticketData.created_by_user),
          workerName: getUserFullName(ticketData.assigned_user),
          creatorEmail: getUserEmail(ticketData.created_by_user),
          workerEmail: getUserEmail(ticketData.assigned_user)
        })

        console.log('Webhook result:', webhookResult)
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError)
      }
    }
    
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
