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
    
    // Check if service role key is available
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('Service role key available:', hasServiceRole)
    
    if (!hasServiceRole) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set!')
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
        details: 'Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables'
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
    console.log('Attempting to delete ticket with ID:', id)
    
    // First, let's verify the ticket exists with the same query
    const { data: verifyTicket, error: verifyError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status')
      .eq('id', id)
      .single()
    
    console.log('Verify ticket exists:', verifyTicket)
    console.log('Verify error:', verifyError)
    
    if (!verifyTicket) {
      console.error('Ticket verification failed - ticket does not exist')
      return NextResponse.json({
        error: 'Ticket not found',
        details: 'Ticket does not exist in database',
        ticketId: id
      }, { status: 404 })
    }
    
    // Now attempt the delete
    const { data: deleteResult, error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id)
      .select('id')
    
    console.log('Delete result:', deleteResult)
    console.log('Delete error:', error)
    
    if (error) {
      console.error('Error deleting ticket:', error)
      return NextResponse.json({
        error: 'Failed to delete ticket',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }
    
    if (!deleteResult || deleteResult.length === 0) {
      console.error('No rows were deleted - ticket might not exist or already deleted')
      return NextResponse.json({
        error: 'Ticket not found or already deleted',
        details: 'No rows were affected by the delete operation'
      }, { status: 404 })
    }
    
    console.log('Ticket deleted successfully')
    
    // Send webhook for ticket deletion
    if (ticketData) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(ticketData.deadline)
        
        console.log('Sending webhook for ticket deletion')
        const webhookResult = await sendWebhook({
          action: 'deleted',
          ticket_id: ticketData.id,
          ticket_title: ticketData.title,
          urgency: ticketData.urgency,
          dateTicket,
          timeTicket,
          creatorName: getUserFullName(ticketData.created_by_user),
          workerName: getUserFullName(ticketData.assigned_user),
          creatorEmail: getUserEmail(ticketData.created_by_user),
          workerEmail: getUserEmail(ticketData.assigned_user),
          user_id: ticketData.created_by,
          user_name: getUserFullName(ticketData.created_by_user),
          admin_id: ticketData.assigned_to
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
