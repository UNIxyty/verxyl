import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { sendWebhook, extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== COMPLETE TICKET API ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const { id } = params
    const solutionData = await request.json()
    
    console.log('Completing ticket:', id, 'with solution:', solutionData)
    
    const updates = {
      status: 'completed' as const,
      solution_type: solutionData.solutionType,
      solution_data: solutionData.solutionData,
      output_result: solutionData.outputResult
    }
    
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .single()
    
    if (error) {
      console.error('Error completing ticket:', error)
      return NextResponse.json({
        error: 'Failed to complete ticket',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Ticket completed successfully:', data)
    
    // Send webhook for ticket completion
    if (data) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(data.deadline)
        
        console.log('Sending webhook for ticket completion')
        const webhookResult = await sendWebhook({
          ticketAction: 'solved',
          ticket_id: data.id,
          ticket_title: data.title,
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
    console.error('=== COMPLETE TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
