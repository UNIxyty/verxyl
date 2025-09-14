import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Debug: Log available cookies
    const allCookies = cookieStore.getAll()
    console.log('User status API - available cookies:', allCookies.map(c => c.name))
    
    // Debug: Check environment variables
    console.log('User status API - Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('User status API - Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`Cookie ${name}:`, cookie?.value ? 'exists' : 'missing')
            return cookie?.value
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('User status API - auth result:', { user: user?.id, error })
    
    if (error || !user) {
      console.error('User status API - auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User status API - getting user data for:', user.id)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User status API - user query error:', userError)
      return NextResponse.json({ error: 'User not found', details: userError.message }, { status: 404 })
    }

    console.log('User status API - returning user data:', { 
      id: userData.id, 
      role: userData.role, 
      approval_status: userData.approval_status 
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('User status API - unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
