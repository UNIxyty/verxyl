import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { extractDateTime, getUserFullName, getUserEmail } from '@/lib/webhook-utils'

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
    const updateData = await request.json()
    
    console.log('Editing ticket:', id, 'with data:', updateData)
    
    // First check if ticket has already been edited
    const { data: existingTicket, error: fetchError } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({
        error: 'Failed to edit ticket',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }
    
    console.log('Ticket edited successfully:', data)
    
    
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
