import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BYPASS TICKETS API START ===')
    
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json({
        error: 'Supabase not configured properly'
      }, { status: 500 })
    }
    
    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
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
    const { data, error } = await supabase
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
