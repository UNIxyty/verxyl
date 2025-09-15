import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// PATCH - Mark mail as read/unread
export async function PATCH(
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
    const { is_read } = await request.json()

    if (typeof is_read !== 'boolean') {
      return NextResponse.json({ error: 'is_read must be a boolean' }, { status: 400 })
    }

    // Update mail read status (only recipient can mark as read)
    const { data: mail, error } = await supabase
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
      return NextResponse.json({ error: 'Failed to update mail', details: error.message }, { status: 500 })
    }

    if (!mail) {
      return NextResponse.json({ error: 'Mail not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ mail, message: `Mail marked as ${is_read ? 'read' : 'unread'}` })
  } catch (error) {
    console.error('Unexpected error in mail read PATCH:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
