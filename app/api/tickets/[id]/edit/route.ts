import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { sendWebhook, extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== EDIT TICKET API ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const { id } = params
    const updateData = await request.json()
    
    console.log('Editing ticket:', id, 'with data:', updateData)
    
    // First check if ticket has already been edited
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('edited')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Error checking ticket edit status:', fetchError)
      return NextResponse.json({
        error: 'Failed to check ticket status'
      }, { status: 500 })
    }
    
    if (existingTicket.edited) {
      return NextResponse.json({
        error: 'This ticket has already been edited and cannot be modified again.'
      }, { status: 400 })
    }
    
    // Update the ticket
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        ...updateData, 
        edited: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .single()
    
    if (error) {
      console.error('Error editing ticket:', error)
      return NextResponse.json({
        error: 'Failed to edit ticket',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Ticket edited successfully:', data)
    
    // Send webhook for ticket update
    if (data) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(data.deadline)
        
        console.log('Sending webhook for ticket update')
        const webhookResult = await sendWebhook({
          ticketAction: 'updated',
          ticket_id: data.id,
          urgency: data.urgency,
          dateTicket,
          timeTicket,
          creatorName: getUserFullName(data.created_by_user),
          workerName: getUserFullName(data.assigned_user),
          creatorEmail: getUserEmail(data.created_by_user),
          workerEmail: getUserEmail(data.assigned_user)
        })

        console.log('Webhook result:', webhookResult)
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError)
      }
    }
    
    return NextResponse.json({
      success: true,
      ticket: data
    })
    
  } catch (error) {
    console.error('=== EDIT TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
