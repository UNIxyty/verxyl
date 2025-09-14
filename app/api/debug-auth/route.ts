import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Debug: Log all available cookies
    const allCookies = cookieStore.getAll()
    console.log('Debug Auth API - All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'exists' : 'missing' })))
    
    // Debug: Check environment variables
    console.log('Debug Auth API - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Debug Auth API - Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`Debug Auth API - Cookie ${name}:`, cookie?.value ? 'exists' : 'missing')
            return cookie?.value
          },
        },
      }
    )

    // Try to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Debug Auth API - Auth result:', { 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error',
        details: authError.message,
        cookies: allCookies.map(c => c.name),
        env: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'No user found',
        cookies: allCookies.map(c => c.name),
        env: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 401 })
    }

    // Try to get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Debug Auth API - User data result:', { 
      userData: userData ? 'found' : 'not found',
      userError: userError?.message 
    })

    return NextResponse.json({
      success: true,
      auth: {
        userId: user.id,
        userEmail: user.email,
        userMetadata: user.user_metadata
      },
      database: {
        userExists: !!userData,
        userData: userData || null,
        error: userError?.message || null
      },
      cookies: allCookies.map(c => ({ name: c.name, exists: !!c.value })),
      env: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

  } catch (error) {
    console.error('Debug Auth API - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
