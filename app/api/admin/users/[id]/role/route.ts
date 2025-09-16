import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNewWebhook } from '@/lib/new-webhook'

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

    // Check if current user is admin and get their full data
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status, full_name, email')
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

    // Update user role directly (previous working logic)
    console.log('Attempting direct update for user role:', { targetUserId, role })
    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', targetUserId)
      .select('id, email, role, approval_status, created_at, full_name')

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user role',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 })
    }

    if (!updatedUsers || updatedUsers.length === 0) {
      console.error('No rows were affected by the update')
      return NextResponse.json({ 
        error: 'User not found or update failed - no rows affected',
        targetUserId
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

    // Send new webhook for role change
    try {
      // Get user notification settings for the target user
      const { getUserNotificationSettings } = await import('@/lib/new-webhook')
      const notificationSettings = await getUserNotificationSettings(targetUserId)
      
      await sendNewWebhook({
        action: 'role_changed',
        timestamp: new Date().toISOString(),
        admin_id: user.id,
        admin_email: user.email || '',
        admin_name: currentUserData.full_name || currentUserData.email || 'Admin User',
        user_id: targetUserId,
        user_email: updatedUser.email,
        user_name: updatedUser.full_name || updatedUser.email,
        roleChanged: true,
        prevRole: targetUser.role,
        currentRole: role,
        // Add notifications object for user webhooks
        notifications: {
          rolechange: true
        }
      })
    } catch (webhookError) {
      console.error('New webhook error for role change:', webhookError)
      // Don't fail the request if webhook fails
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
