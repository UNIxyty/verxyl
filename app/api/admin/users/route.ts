import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    console.log('Admin check:', { adminUser, adminError, userId: user.id })

    if (adminError) {
      console.error('Admin check error:', adminError)
      return NextResponse.json({ error: 'Failed to check admin status', details: adminError.message }, { status: 500 })
    }

    if (adminUser?.role !== 'admin' || adminUser?.approval_status !== 'approved') {
      console.log('Not admin:', { role: adminUser?.role, approval_status: adminUser?.approval_status })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users', details: usersError.message }, { status: 500 })
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Unexpected error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
