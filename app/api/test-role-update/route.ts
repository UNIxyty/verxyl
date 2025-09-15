import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { userId, role } = await request.json()

    console.log('=== ROLE UPDATE TEST ===')
    console.log('User ID:', userId)
    console.log('New role:', role)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user?.id)
    console.log('Auth error:', authError)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authError: authError?.message }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    console.log('Current user data:', currentUserData)
    console.log('Current user error:', userError)

    if (userError || currentUserData.role !== 'admin' || currentUserData.approval_status !== 'approved') {
      return NextResponse.json({ 
        error: 'Admin access required',
        userError: userError?.message,
        currentUserData
      }, { status: 403 })
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, approval_status')
      .eq('id', userId)
      .single()

    console.log('Target user:', targetUser)
    console.log('Target user error:', targetError)

    if (targetError) {
      return NextResponse.json({
        error: 'User not found',
        targetError: targetError.message,
        code: targetError.code
      }, { status: 404 })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.approval_status !== 'approved') {
      return NextResponse.json({ 
        error: 'Can only change roles for approved users',
        targetUserStatus: targetUser.approval_status
      }, { status: 400 })
    }

    // Try to update the user role
    console.log('Attempting to update user role...')
    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, role, approval_status, created_at')

    console.log('Update result:', { updatedUsers, updateError })

    if (updateError) {
      console.error('Update error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json({
        error: 'Failed to update user role',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 })
    }

    // Check if any rows were affected
    if (!updatedUsers || updatedUsers.length === 0) {
      console.error('No rows were affected by the update')
      return NextResponse.json({
        error: 'User not found or update failed - no rows affected',
        userId,
        debug: {
          originalUser: targetUser,
          updateResult: updatedUsers
        }
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser,
      debug: {
        originalUser: targetUser,
        updatedUser: updatedUser,
        rowsAffected: updatedUsers.length
      }
    })

  } catch (error) {
    console.error('Test role update error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
