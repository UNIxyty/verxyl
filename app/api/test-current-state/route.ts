import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING CURRENT DATABASE STATE ===')
    
    // 1. Test basic user lookup
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5)
    
    console.log('Users lookup:', { users, usersError })
    
    // 2. Test specific user lookup
    const { data: specificUser, error: specificUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
    
    console.log('Specific user lookup:', { specificUser, specificUserError })
    
    // 3. Test a simple update (same value)
    if (specificUser && specificUser.length > 0) {
      const targetUser = specificUser[0]
      console.log('Target user found:', targetUser)
      
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: targetUser.role }) // Update to same role
        .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
        .select('*')
      
      console.log('Same role update result:', { updateResult, updateError })
      
      // 4. Test updating to a different role
      const newRole = targetUser.role === 'viewer' ? 'admin' : 'viewer'
      const { data: differentRoleResult, error: differentRoleError } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
        .select('*')
      
      console.log('Different role update result:', { differentRoleResult, differentRoleError })
      
      // 5. Revert back
      const { data: revertResult, error: revertError } = await supabaseAdmin
        .from('users')
        .update({ role: targetUser.role })
        .eq('id', '51066252-834f-4302-ac5b-a05e7e6a56ec')
        .select('*')
      
      console.log('Revert result:', { revertResult, revertError })
    }
    
    console.log('=== DATABASE STATE TEST COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      results: {
        usersLookup: { users, usersError },
        specificUserLookup: { specificUser, specificUserError }
      }
    })
    
  } catch (error) {
    console.error('Database state test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
