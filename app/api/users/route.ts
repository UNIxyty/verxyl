import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== GET USERS API START ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 500 })
    }
    
    // Get all users to see what IDs are available
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, approval_status')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('Users fetched successfully:', data?.length || 0)
    
    return NextResponse.json({
      success: true,
      users: data || [],
      count: data?.length || 0
    })
    
  } catch (error) {
    console.error('=== GET USERS API ERROR ===', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
