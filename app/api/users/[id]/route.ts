import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch user profile by ID
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

    // Fetch user profile
    const { data: targetUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at, approval_status, avatar_url')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Unexpected error in user profile GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
