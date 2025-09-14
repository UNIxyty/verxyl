import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== AUTH TICKETS API START ===')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Missing or invalid authorization header'
      }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('Using token:', token.substring(0, 20) + '...')
    
    // Create Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    // Get the current user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({
        error: 'Authentication failed',
        details: userError?.message
      }, { status: 401 })
    }
    
    console.log('Authenticated user:', user.id)
    
    const body = await request.json()
    console.log('Creating ticket with data:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'urgency', 'details', 'assigned_to']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 })
    }
    
    // Prepare ticket data with authenticated user as creator
    const ticketData = {
      title: body.title,
      urgency: body.urgency,
      details: body.details,
      assigned_to: body.assigned_to,
      created_by: user.id, // Use authenticated user's ID
      status: 'new',
      deadline: body.deadline || null
    }
    
    console.log('Inserting ticket with authenticated context:', ticketData)
    
    // Insert ticket with proper authentication context
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
    
    console.log('Ticket created successfully:', data)
    console.log('=== AUTH TICKETS API SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      ticket: data
    })
    
  } catch (error) {
    console.error('=== AUTH TICKETS API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
