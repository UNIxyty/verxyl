import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// PATCH - Mark mail as read/unread
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = params
    const { is_read } = await request.json()

    if (typeof is_read !== 'boolean') {
      return NextResponse.json({ error: 'is_read must be a boolean' }, { status: 400 })
    }

    // Update mail read status (only recipient can mark as read)
    const { data: mail, error } = await supabaseAdmin
      .from('mails')
      .update({
        is_read,
        read_at: is_read ? new Date().toISOString() : null
      })
      .eq('id', id)
      .eq('recipient_id', user.id) // Only recipient can mark as read
      .select('*')
      .single()

    if (error) {
      console.error('Error updating mail read status:', error)
      return NextResponse.json({ error: 'Failed to update mail' }, { status: 500 })
    }

    if (!mail) {
      return NextResponse.json({ error: 'Mail not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ mail, message: `Mail marked as ${is_read ? 'read' : 'unread'}` })
  } catch (error) {
    console.error('Unexpected error in mail read PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
