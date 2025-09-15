import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log('Auth callback called with code:', !!code)

    if (code) {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = cookieStore.get(name)
              console.log(`Auth callback - Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing')
              return cookie?.value
            },
            set(name: string, value: string, options: any) {
              console.log(`Auth callback - Setting cookie ${name}`)
              cookieStore.set({ 
                name, 
                value, 
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                ...options 
              })
            },
            remove(name: string, options: any) {
              console.log(`Auth callback - Removing cookie ${name}`)
              cookieStore.set({ 
                name, 
                value: '', 
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 0,
                ...options 
              })
            },
          },
        }
      )
      
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      console.log('Session exchanged successfully')
      
      // Check user approval status
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=user_not_found`)
      }

      console.log('User authenticated:', user.id, user.email)
      
      // First, ensure user exists in users table
      const { data: userData, error: userQueryError } = await supabase
        .from('users')
        .select('approval_status, role')
        .eq('id', user.id)
        .single()

      console.log('User query result:', { userData, userQueryError })

      // If user doesn't exist in users table, create them
      if (userQueryError && userQueryError.code === 'PGRST116') {
        console.log('Creating new user in database:', user.id)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            approval_status: 'pending',
            role: 'viewer'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
        }
        
        console.log('New user created, redirecting to pending approval')
        // New user created, redirect to pending approval
        return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
      }

      // If user exists but has pending/rejected status, redirect to pending approval
      if (userData && (userData.approval_status === 'pending' || userData.approval_status === 'rejected')) {
        console.log('User has pending/rejected status, redirecting to pending approval')
        return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
      }
      
      // Only redirect to dashboard if user is approved
      if (userData && userData.approval_status === 'approved') {
        console.log('User is approved, redirecting to dashboard')
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }

      console.log('No matching condition, redirecting to dashboard as fallback')
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unexpected`)
  }
}
