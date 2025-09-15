import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendNewWebhook } from '@/lib/new-webhook'
import { extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BYPASS TICKETS API START ===')
    
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured')
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    // Use regular Supabase client (RLS should be disabled)
    console.log('Using regular Supabase client')
    
    const body = await request.json()
    console.log('Creating ticket with bypass:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'urgency', 'details', 'assigned_to', 'created_by']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 })
    }
    
    // Validate UUID format for user IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.assigned_to)) {
      return NextResponse.json({
        error: 'Invalid assigned_to user ID format',
        details: 'Expected valid UUID format'
      }, { status: 400 })
    }
    
    if (!uuidRegex.test(body.created_by)) {
      return NextResponse.json({
        error: 'Invalid created_by user ID format',
        details: 'Expected valid UUID format'
      }, { status: 400 })
    }
    
    // Prepare ticket data
    const ticketData = {
      title: body.title,
      urgency: body.urgency,
      details: body.details,
      assigned_to: body.assigned_to,
      created_by: body.created_by,
      status: 'new',
      deadline: body.deadline || null
    }
    
    console.log('Inserting ticket with service role (bypassing RLS):', ticketData)
    
    // Insert ticket with service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({
        error: 'Database error',
        details: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 })
    }
    
    console.log('Ticket created successfully with bypass:', data)
    
    // Send webhook for ticket creation
    if (data) {
      try {
        const { dateTicket, timeTicket } = extractDateTime(data.deadline)
        
        console.log('Sending webhook for ticket creation (bypass)')
        const webhookResult = await sendNewWebhook({
          action: 'ticket_created',
          timestamp: new Date().toISOString(),
          ticket_id: data.id,
          ticket_title: data.title,
          ticket_urgency: data.urgency,
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
    
    console.log('=== BYPASS TICKETS API SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      ticket: data
    })
    
  } catch (error) {
    console.error('=== BYPASS TICKETS API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
