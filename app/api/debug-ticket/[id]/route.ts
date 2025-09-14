import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DEBUG TICKET API ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const { id } = params
    console.log('Debugging ticket ID:', id)
    
    // First, check if ticket exists
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        assigned_user:users!assigned_to(*),
        created_by_user:users!created_by(*)
      `)
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching ticket:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch ticket',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 })
    }
    
    if (!ticket) {
      // Let's also check if there are any tickets at all
      const { data: allTickets, error: allTicketsError } = await supabaseAdmin
        .from('tickets')
        .select('id, title, created_at')
        .limit(10)
        .order('created_at', { ascending: false })
      
      return NextResponse.json({
        ticket: null,
        message: 'Ticket not found',
        ticketId: id,
        allTickets: allTickets || [],
        allTicketsError: allTicketsError?.message
      })
    }
    
    console.log('Ticket found:', ticket)
    
    return NextResponse.json({
      success: true,
      ticket: ticket,
      ticketId: id
    })
    
  } catch (error) {
    console.error('=== DEBUG TICKET API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
