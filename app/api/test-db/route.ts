import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured')
      return NextResponse.json({
        error: 'Supabase not configured',
        configured: false,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    }
    
    console.log('Supabase is configured, testing connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      })
    }
    
    console.log('Database connection successful')
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      configured: true
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
