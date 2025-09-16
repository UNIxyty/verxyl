import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications', details: error.message }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({ 
      notifications, 
      unread_count: unreadCount || 0 
    })
  } catch (error) {
    console.error('Unexpected error in notifications GET:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// POST - Mark notification as read
export async function POST(request: NextRequest) {
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

    const { notification_id, mark_all_read = false } = await request.json()

    if (mark_all_read) {
      // Mark all notifications as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError)
        return NextResponse.json({ error: 'Failed to mark notifications as read', details: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ message: 'All notifications marked as read' })
    } else if (notification_id) {
      // Mark specific notification as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notification_id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error marking notification as read:', updateError)
        return NextResponse.json({ error: 'Failed to mark notification as read', details: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ message: 'Notification marked as read' })
    } else {
      return NextResponse.json({ error: 'notification_id or mark_all_read required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error in notifications POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
