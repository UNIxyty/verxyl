import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING USERS TABLE ===')
    
    // 1. Get all users
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('*')
    
    console.log('All users query:', { allUsers, allUsersError })
    
    // 2. Get specific user
    const { data: specificUser, error: specificUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
    
    console.log('Specific user query:', { specificUser, specificUserError })
    
    // 3. Try to update the specific user (just to test)
    const { data: updateTest, error: updateTestError } = await supabaseAdmin
      .from('users')
      .update({ role: 'user' }) // Keep same role
      .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
      .select('*')
    
    console.log('Update test:', { updateTest, updateTestError })
    
    console.log('=== USERS TABLE TEST COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      allUsers: allUsers || [],
      allUsersError,
      specificUser: specificUser || [],
      specificUserError,
      updateTest: updateTest || [],
      updateTestError
    })
    
  } catch (error) {
    console.error('Test users table error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
