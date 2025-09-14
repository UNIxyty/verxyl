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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('approval_status')
        .eq('id', user.id)
        .single()

      // If user doesn't exist in users table or has pending/rejected status, redirect to pending approval
      if (userError || !userData || userData.approval_status === 'pending' || userData.approval_status === 'rejected') {
        return NextResponse.redirect(`${requestUrl.origin}/pending-approval`)
      }
      
      // Only redirect to dashboard if user is approved
      if (userData.approval_status === 'approved') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
