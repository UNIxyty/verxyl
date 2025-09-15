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

    const { approval_status } = await request.json()
    const targetUserId = params.id

    // Validate approval status
    if (!['pending', 'approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ error: 'Invalid approval status. Must be pending, approved, or rejected' }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, approval_status')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user approval status
    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        approval_status
      })
      .eq('id', targetUserId)
      .select('id, email, role, approval_status, created_at')

    if (updateError) {
      console.error('Error updating user approval status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user approval status',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 })
    }

    // Check if any rows were affected
    if (!updatedUsers || updatedUsers.length === 0) {
      console.error('No rows were affected by the approval status update')
      return NextResponse.json({ 
        error: 'User not found or update failed - no rows affected',
        targetUserId
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

    return NextResponse.json({
      success: true,
      message: `User approval status updated to ${approval_status}`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user approval status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
