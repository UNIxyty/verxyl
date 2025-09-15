import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch user statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params

    // Verify user exists using session client
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found', details: userError?.message }, { status: 404 })
    }

    // Get tickets created by user
    const { count: ticketsCreated } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', id)

    // Get tickets assigned to user
    const { count: ticketsAssigned } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', id)

    // Get tickets completed by user
    const { count: ticketsCompleted } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', id)
      .eq('status', 'completed')

    // Get mails sent by user
    const { count: mailsSent } = await supabase
      .from('mails')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', id)

    // Get mails received by user
    const { count: mailsReceived } = await supabase
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
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
