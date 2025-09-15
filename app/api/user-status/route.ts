import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('User status API - Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('User status API - auth error:', authError.message)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('User status API - no user found')
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, approval_status, full_name, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User status API - user query error:', userError.message)
      
      if (userError.code === 'PGRST116') {
        // Return 200 with a neutral payload so clients don't treat it as a hard failure
        return NextResponse.json({
          needsRegistration: true,
          role: null,
          approval_status: null
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch user data', 
        details: userError.message 
      }, { status: 500 })
    }

    // Validate user data
    if (!userData.role || !userData.approval_status) {
      console.error('User status API - incomplete user data:', userData)
      return NextResponse.json({ 
        error: 'Incomplete user data',
        details: 'User role or approval status missing' 
      }, { status: 500 })
    }

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      approval_status: userData.approval_status,
      full_name: userData.full_name,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    })
    
  } catch (error) {
    console.error('User status API - unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
