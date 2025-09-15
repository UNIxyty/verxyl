import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || currentUserData.role !== 'admin' || currentUserData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { role } = await request.json()
    const targetUserId = params.id

    // Validate role
    if (!['admin', 'worker', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, worker, or viewer' }, { status: 400 })
    }

    // Check if target user exists and is approved
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, approval_status')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Can only change roles for approved users' }, { status: 400 })
    }

    // Prevent admin from removing their own admin role if they're the only admin
    if (role !== 'admin' && targetUserId === user.id) {
      const { data: adminCount } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('approval_status', 'approved')

      if (adminCount && adminCount.length <= 1) {
        return NextResponse.json({ 
          error: 'Cannot remove admin role. At least one admin must remain in the system.' 
        }, { status: 400 })
      }
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('id, email, role, approval_status, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
