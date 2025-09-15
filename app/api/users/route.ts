import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all users (for compose mail, etc.)
export async function GET() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch all approved users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('approval_status', 'approved')
      .order('full_name', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Don't include the current user in the list
    const filteredUsers = users.filter(u => u.id !== user.id)

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('Unexpected error in users GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}