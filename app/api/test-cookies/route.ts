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
    
    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookieNames: allCookies.map(c => c.name),
      supabaseCookieNames: supabaseCookies.map(c => c.name)
    })
  } catch (error) {
    console.error('Test cookies API error:', error)
    return NextResponse.json({ error: 'Failed to read cookies' }, { status: 500 })
  }
}
