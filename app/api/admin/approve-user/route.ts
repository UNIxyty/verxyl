import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    if (adminError) {
      console.error('Admin check error:', adminError)
      return NextResponse.json({ error: 'Failed to check admin status', details: adminError.message }, { status: 500 })
    }

    if (adminUser?.role !== 'admin' || adminUser?.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, action, reason } = await request.json()

    if (action === 'approve') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Approve user error:', updateError)
        return NextResponse.json({ error: 'Failed to approve user', details: updateError.message }, { status: 500 })
      }
    } else if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          approval_status: 'rejected',
          rejection_reason: reason || null,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Reject user error:', updateError)
        return NextResponse.json({ error: 'Failed to reject user', details: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in approve user API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
