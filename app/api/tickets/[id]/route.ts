import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendWebhook, extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE TICKET API ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    const { id } = params
    const updateData = await request.json()
    
    console.log('Updating ticket:', id, 'with data:', updateData)

    const { data: ticket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Send webhook for ticket update
    if (ticket) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(ticket.deadline)
        
        // Determine webhook action based on what was updated
        let webhookAction: 'updated' | 'in_work' = 'updated'
        if (updateData.status === 'in_progress') {
          webhookAction = 'in_work'
          console.log('Sending webhook for ticket work started via API')
        } else {
          console.log('Sending webhook for ticket update via API')
        }
        
        const webhookResult = await sendWebhook({
          action: webhookAction,
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          urgency: ticket.urgency,
          dateTicket,
          timeTicket,
          creatorName: getUserFullName(ticket.created_by_user),
          workerName: getUserFullName(ticket.assigned_user),
          creatorEmail: getUserEmail(ticket.created_by_user),
          workerEmail: getUserEmail(ticket.assigned_user),
          user_id: ticket.created_by,
          user_name: getUserFullName(ticket.created_by_user),
          admin_id: ticket.assigned_to
        })

        console.log('Webhook result:', webhookResult)
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError)
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Unexpected error in update ticket API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
