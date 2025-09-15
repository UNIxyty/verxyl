import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch user profile by ID
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

    // Fetch user profile using session client for RLS
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, approval_status, avatar_url')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'User not found', details: error.message }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Unexpected error in user profile GET:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
