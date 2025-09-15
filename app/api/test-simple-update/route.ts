import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING SIMPLE UPDATE ===')
    
    const userId = '51066252-834f-4302-ac5b-a05e7e6a56ec'
    
    // 1. Get current user
    const { data: currentUser, error: currentError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('Current user:', { currentUser, currentError })
    
    if (currentError || !currentUser) {
      return NextResponse.json({ error: 'User not found', details: currentError })
    }
    
    // 2. Try to update role
    const newRole = currentUser.role === 'worker' ? 'viewer' : 'worker'
    console.log('Attempting to update role from', currentUser.role, 'to', newRole)
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select('*')
    
    console.log('Update result:', { updateResult, updateError })
    
    // 3. Verify the update
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('Verification:', { verifyUser, verifyError })
    
    // 4. Revert back to original role
    const { data: revertResult, error: revertError } = await supabaseAdmin
      .from('users')
      .update({ role: currentUser.role })
      .eq('id', userId)
      .select('*')
    
    console.log('Revert result:', { revertResult, revertError })
    
    console.log('=== SIMPLE UPDATE TEST COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      test: {
        currentUser,
        updateAttempt: { newRole, updateResult, updateError },
        verification: { verifyUser, verifyError },
        revert: { revertResult, revertError }
      }
    })
    
  } catch (error) {
    console.error('Simple update test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
