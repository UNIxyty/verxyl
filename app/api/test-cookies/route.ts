import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('Test cookies API - all cookies:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })))
    
    // Check for Supabase auth cookies specifically
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.includes('sb-') || 
      c.name.includes('auth')
    )
    
    console.log('Test cookies API - Supabase cookies:', supabaseCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })))
    
    // Try to authenticate with Supabase
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Test cookies API - Auth result:', { 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    })

    // Try to query user data from database
    let userData = null
    let userError = null
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      userData = data
      userError = error
      console.log('Test cookies API - User data result:', { 
        userData: userData ? 'found' : 'not found',
        userError: userError?.message 
      })
    }
    
    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookieNames: allCookies.map(c => c.name),
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      auth: {
        authenticated: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        authError: authError?.message || null
      },
      database: {
        userExists: !!userData,
        userData: userData || null,
        error: userError?.message || null
      },
      env: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })
  } catch (error) {
    console.error('Test cookies API error:', error)
    return NextResponse.json({ 
      error: 'Failed to read cookies', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
