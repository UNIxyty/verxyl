import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params

    // Verify user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get tickets created by user
    const { count: ticketsCreated } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', id)

    // Get tickets assigned to user
    const { count: ticketsAssigned } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', id)

    // Get tickets completed by user
    const { count: ticketsCompleted } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', id)
      .eq('status', 'completed')

    // Get mails sent by user
    const { count: mailsSent } = await supabaseAdmin
      .from('mails')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', id)

    // Get mails received by user
    const { count: mailsReceived } = await supabaseAdmin
      .from('mails')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', id)

    const stats = {
      tickets_created: ticketsCreated || 0,
      tickets_assigned: ticketsAssigned || 0,
      tickets_completed: ticketsCompleted || 0,
      mails_sent: mailsSent || 0,
      mails_received: mailsReceived || 0
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Unexpected error in user stats GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
