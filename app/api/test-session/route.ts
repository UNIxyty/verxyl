import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Look for Supabase auth cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('session')
    )
    
    return NextResponse.json({
      totalCookies: allCookies.length,
      authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      allCookieNames: allCookies.map(c => c.name),
      headers: Object.fromEntries(request.headers.entries())
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to read cookies',
      details: (error as Error).message
    }, { status: 500 })
  }
}
