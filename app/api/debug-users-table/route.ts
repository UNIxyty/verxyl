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

    console.log('=== USERS TABLE DEBUG ===')

    // Check table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => ({ data: null, error: 'RPC not available' }))

    console.log('Table columns:', { columns, columnsError })

    // Get a sample user
    const { data: sampleUser, error: sampleError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
      .single()

    console.log('Sample user:', { sampleUser, sampleError })

    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'users')
      .single()

    console.log('RLS status:', { rlsStatus, rlsError })

    return NextResponse.json({
      success: true,
      debug: {
        columns: columns || 'RPC not available',
        sampleUser: sampleUser || null,
        sampleError: sampleError ? {
          message: sampleError.message,
          code: sampleError.code,
          details: sampleError.details
        } : null,
        rlsStatus: rlsStatus || null,
        rlsError: rlsError ? {
          message: rlsError.message,
          code: rlsError.code
        } : null
      }
    })

  } catch (error) {
    console.error('Debug users table error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
