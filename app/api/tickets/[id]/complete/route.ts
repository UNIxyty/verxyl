import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendNewWebhook } from '@/lib/new-webhook'
import { extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook-utils'

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
    const solutionData = await request.json()
    
    console.log('Completing ticket:', id, 'with solution:', solutionData)
    
    const updates = {
      status: 'completed' as const,
      solution_type: solutionData.solutionType,
      solution_data: solutionData.solutionData,
      output_result: solutionData.outputResult
    }
    
    const { data, error } = await supabaseAdmin
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({
        error: 'Failed to complete ticket',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }
    
    console.log('Ticket completed successfully:', data)
    
    // Send webhook for ticket completion
    if (data) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(data.deadline)
        
        console.log('Sending webhook for ticket completion')
        const webhookResult = await sendNewWebhook({
          action: 'ticket_solved',
          timestamp: new Date().toISOString(),
          ticket_id: data.id,
          ticket_title: data.title,
          ticket_urgency: data.urgency,
          ticket_status: 'completed',
          ticket_deadline: data.deadline,
          ticket_date: dateTicket,
          ticket_time: timeTicket,
          creator_id: data.created_by,
          creator_email: getUserEmail(data.created_by_user),
          creator_name: getUserFullName(data.created_by_user),
          worker_id: data.assigned_to,
          worker_email: getUserEmail(data.assigned_user),
          worker_name: getUserFullName(data.assigned_user),
          admin_id: data.assigned_to,
          admin_email: getUserEmail(data.assigned_user),
          admin_name: getUserFullName(data.assigned_user)
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
