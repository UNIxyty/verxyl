import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
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

    // First, get the current ticket status to check for changes
    const { data: currentTicket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching current ticket:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
    }

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

    // Send webhook for ticket update ONLY if status actually changed
    if (ticket) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(ticket.deadline)
        
        // Determine webhook action based on what was updated
        let webhookAction: 'updated' | 'in_work' = 'updated'
        let shouldSendWebhook = true
        
        if (updateData.status === 'in_progress' && currentTicket.status !== 'in_progress') {
          webhookAction = 'in_work'
          console.log('Sending webhook for ticket work started via API (status changed from', currentTicket.status, 'to in_progress)')
        } else if (updateData.status === 'in_progress' && currentTicket.status === 'in_progress') {
          console.log('Ticket is already in_progress, skipping webhook')
          shouldSendWebhook = false
        } else {
          console.log('Sending webhook for ticket update via API')
        }
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
