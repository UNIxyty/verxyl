import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH ===')
    
    // Check environment variables
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      }, { status: 500 })
    }

    const cookieStore = cookies()
    console.log('Cookie store available:', !!cookieStore)
    
    // List all cookies
    const allCookies = cookieStore.getAll()
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`Getting cookie ${name}:`, !!cookie?.value)
            return cookie?.value
          },
        },
      }
    )

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { 
      user: user?.id, 
      email: user?.email,
      error: authError?.message 
    })
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message,
        code: authError.status
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user found',
        details: 'User is null'
      }, { status: 401 })
    }

    // Test user table access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single()

    console.log('User table access:', { 
      userData: !!userData, 
      error: userError?.message 
    })

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      userData,
      debug: {
        environment_configured: true,
        cookies_available: true,
        auth_successful: true,
        user_table_accessible: !userError
      }
    })

  } catch (error) {
    console.error('Unexpected error in debug auth:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 })
  }
}