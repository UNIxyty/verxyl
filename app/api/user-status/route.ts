import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    const { data: { user }, error } = await supabase.auth.getUser()
    
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
