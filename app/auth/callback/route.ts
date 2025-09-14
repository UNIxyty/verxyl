import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    await supabase.auth.exchangeCodeForSession(code)
    
    // Check user approval status
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // First, ensure user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('approval_status, role')
        .eq('id', user.id)
        .single()

      // If user doesn't exist in users table, create them
      if (userError && userError.code === 'PGRST116') {
        console.log('Creating new user in database:', user.id)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            approval_status: 'pending',
            role: 'user'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
        }
        
        // New user created, redirect to pending approval
        return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
      }

      // If user exists but has pending/rejected status, redirect to pending approval
      if (userData && (userData.approval_status === 'pending' || userData.approval_status === 'rejected')) {
        return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
      }
      
      // Only redirect to dashboard if user is approved
      if (userData && userData.approval_status === 'approved') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
