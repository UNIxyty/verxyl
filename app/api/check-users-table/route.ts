import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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

    console.log('=== USERS TABLE CHECK ===')

    // Get all users to see the table structure
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5)

    console.log('Users sample:', users)
    console.log('Users error:', usersError)

    // Try to get the specific user that's failing
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
      .single()

    console.log('Specific user:', specificUser)
    console.log('Specific user error:', specificError)

    return NextResponse.json({
      success: true,
      debug: {
        usersSample: users || null,
        usersError: usersError ? {
          message: usersError.message,
          code: usersError.code,
          details: usersError.details
        } : null,
        specificUser: specificUser || null,
        specificError: specificError ? {
          message: specificError.message,
          code: specificError.code,
          details: specificError.details
        } : null
      }
    })

  } catch (error) {
    console.error('Check users table error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
