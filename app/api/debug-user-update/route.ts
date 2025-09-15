import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    console.log('=== DEBUG USER UPDATE START ===')
    console.log('Testing user ID:', userId)
    
    // 1. Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
    
    console.log('User lookup result:', { user, userError })
    
    if (userError) {
      return NextResponse.json({ error: 'User lookup failed', details: userError })
    }
    
    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' })
    }
    
    const targetUser = user[0]
    console.log('Target user found:', targetUser)
    
    // 2. Try a simple update (just update the role to the same value to test)
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: targetUser.role }) // Update to same value
      .eq('id', userId)
      .select('*')
    
    console.log('Update test result:', { updateResult, updateError })
    
    // 3. Try updating to a different role
    const newRole = targetUser.role === 'user' ? 'viewer' : 'user'
    const { data: roleUpdateResult, error: roleUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select('*')
    
    console.log('Role update test result:', { roleUpdateResult, roleUpdateError })
    
    // 4. Revert back to original role
    const { data: revertResult, error: revertError } = await supabaseAdmin
      .from('users')
      .update({ role: targetUser.role })
      .eq('id', userId)
      .select('*')
    
    console.log('Revert result:', { revertResult, revertError })
    
    console.log('=== DEBUG USER UPDATE COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      user: targetUser,
      tests: {
        updateTest: { updateResult, updateError },
        roleUpdateTest: { roleUpdateResult, roleUpdateError },
        revertTest: { revertResult, revertError }
      }
    })
    
  } catch (error) {
    console.error('Debug user update error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error })
  }
}
