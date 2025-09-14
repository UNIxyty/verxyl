import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== TESTING SERVICE ROLE ===')
    
    // Check if service role key is available
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const serviceRoleLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    
    console.log('Service role key available:', hasServiceRole)
    console.log('Service role key length:', serviceRoleLength)
    
    if (!hasServiceRole) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
        available: false,
        message: 'Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables'
      }, { status: 500 })
    }
    
    // Test a simple query with service role
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Service role test error:', error)
      return NextResponse.json({
        error: 'Service role query failed',
        details: error.message,
        available: true,
        queryError: true
      }, { status: 500 })
    }
    
    console.log('Service role test successful')
    return NextResponse.json({
      success: true,
      available: true,
      message: 'Service role key is working correctly',
      testQuery: 'passed'
    })
    
  } catch (error) {
    console.error('Service role test exception:', error)
    return NextResponse.json({
      error: 'Service role test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      available: false
    }, { status: 500 })
  }
}
