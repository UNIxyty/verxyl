import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()
    
    console.log('=== TESTING ROLE UPDATE ===')
    console.log('User ID:', userId)
    console.log('Requested role:', role)
    
    // 1. Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
    
    console.log('User lookup:', { user, userError })
    
    if (userError) {
      return NextResponse.json({ error: 'User lookup failed', details: userError })
    }
    
    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' })
    }
    
    const targetUser = user[0]
    console.log('Target user:', targetUser)
    
    // 2. Try to update the role
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('*')
    
    console.log('Update result:', { updateResult, updateError })
    
    if (updateError) {
      return NextResponse.json({ 
        error: 'Update failed', 
        details: updateError,
        code: updateError.code
      })
    }
    
    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({ 
        error: 'No rows affected',
        debug: {
          userId,
          role,
          targetUserExists: !!targetUser,
          targetUserRole: targetUser?.role,
          targetUserApprovalStatus: targetUser?.approval_status
        }
      })
    }
    
    console.log('=== ROLE UPDATE SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      user: updateResult[0]
    })
    
  } catch (error) {
    console.error('Test role update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
