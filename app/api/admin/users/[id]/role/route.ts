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
    console.log('Looking for user with ID:', targetUserId)
    const { data: targetUsers, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, approval_status')
      .eq('id', targetUserId)

    console.log('Target user lookup result:', { targetUsers, targetError })
    
    if (targetError) {
      console.error('Error finding target user:', targetError)
      return NextResponse.json({ 
        error: 'Database error while finding user',
        details: targetError.message,
        code: targetError.code,
        targetUserId
      }, { status: 500 })
    }

    if (!targetUsers || targetUsers.length === 0) {
      console.error('Target user not found in database')
      return NextResponse.json({ 
        error: 'User not found in database',
        targetUserId
      }, { status: 404 })
    }

    const targetUser = targetUsers[0]
    console.log('Current user role:', targetUser.role)
    console.log('Requested role:', role)

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

    // Update user role (without updated_at if column doesn't exist)
    console.log('Attempting to update user role:', {
      targetUserId,
      newRole: role,
      currentRole: targetUser.role
    })
    
    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role
      })
      .eq('id', targetUserId)
      .select('id, email, role, approval_status, created_at')

    console.log('Update operation result:', {
      updatedUsers,
      updateError,
      updatedUsersCount: updatedUsers?.length || 0
    })

    if (updateError) {
      console.error('Error updating user role:', updateError)
      console.error('Error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to update user role',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 })
    }

    // Check if any rows were affected
    if (!updatedUsers || updatedUsers.length === 0) {
      console.error('No rows were affected by the update')
      console.error('Debug info:', {
        targetUserId,
        role,
        targetUserExists: !!targetUser,
        targetUserRole: targetUser?.role,
        targetUserApprovalStatus: targetUser?.approval_status
      })
      return NextResponse.json({ 
        error: 'User not found or update failed - no rows affected',
        targetUserId,
        debug: {
          targetUserId,
          role,
          targetUserExists: !!targetUser,
          targetUserRole: targetUser?.role,
          targetUserApprovalStatus: targetUser?.approval_status
        }
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

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
