import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE TICKETS API START ===')
    
    // Check configuration first
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured')
      return NextResponse.json({
        error: 'Database not configured',
        details: 'Missing Supabase environment variables'
      }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('Received ticket data:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'urgency', 'details', 'assigned_to', 'created_by']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
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
    
    console.log('Inserting ticket data:', ticketData)
    
    // Simple insert without joins first
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
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
    
    console.log('Ticket created successfully:', data)
    console.log('=== SIMPLE TICKETS API SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      ticket: data
    })
    
  } catch (error) {
    console.error('=== SIMPLE TICKETS API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
