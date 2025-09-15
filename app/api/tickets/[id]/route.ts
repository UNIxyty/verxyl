import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendNewWebhook } from '@/lib/new-webhook'
import { extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook-utils'

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
        
        const webhookResult = await sendNewWebhook({
          action: webhookAction === 'in_work' ? 'ticket_in_work' : 'ticket_updated',
          timestamp: new Date().toISOString(),
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          ticket_urgency: ticket.urgency,
          ticket_status: ticket.status,
          ticket_deadline: ticket.deadline,
          ticket_date: dateTicket,
          ticket_time: timeTicket,
          creator_id: ticket.created_by,
          creator_email: getUserEmail(ticket.created_by_user),
          creator_name: getUserFullName(ticket.created_by_user),
          worker_id: ticket.assigned_to,
          worker_email: getUserEmail(ticket.assigned_user),
          worker_name: getUserFullName(ticket.assigned_user),
          admin_id: ticket.assigned_to,
          admin_email: getUserEmail(ticket.assigned_user),
          admin_name: getUserFullName(ticket.assigned_user)
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
