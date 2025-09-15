import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== TESTING ENVIRONMENT VARIABLES ===')
    
    // Check if environment variables are available
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      WEBHOOK_URL: !!process.env.WEBHOOK_URL,
      // Show lengths (without revealing the actual values)
      SUPABASE_URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      SUPABASE_ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      SUPABASE_SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      WEBHOOK_URL_LENGTH: process.env.WEBHOOK_URL?.length || 0
    }
    
    console.log('Environment variables check:', envCheck)
    
    // Check if we can access the Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasValidUrl = supabaseUrl && supabaseUrl.includes('supabase.co')
    
    return NextResponse.json({
      success: true,
      environmentVariables: envCheck,
      hasValidSupabaseUrl: hasValidUrl,
      supabaseUrlStart: supabaseUrl?.substring(0, 30) + '...' || 'Not set',
      message: 'Environment variables status check complete'
    })
    
  } catch (error) {
    console.error('Environment variables test error:', error)
    return NextResponse.json({
      error: 'Environment variables test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
