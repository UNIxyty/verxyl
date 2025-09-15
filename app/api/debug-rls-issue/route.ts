import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()
    
    console.log('=== DEBUGGING RLS ISSUE ===')
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
    
    // 2. Try a simple update first (same role)
    const { data: sameRoleUpdate, error: sameRoleError } = await supabaseAdmin
      .from('users')
      .update({ role: targetUser.role }) // Update to same role
      .eq('id', userId)
      .select('*')
    
    console.log('Same role update:', { sameRoleUpdate, sameRoleError })
    
    // 3. Try updating to a different role
    const { data: differentRoleUpdate, error: differentRoleError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('*')
    
    console.log('Different role update:', { differentRoleUpdate, differentRoleError })
    
    // 4. Check if it's a constraint issue by trying invalid role
    const { data: invalidRoleUpdate, error: invalidRoleError } = await supabaseAdmin
      .from('users')
      .update({ role: 'invalid_role' })
      .eq('id', userId)
      .select('*')
    
    console.log('Invalid role update (should fail):', { invalidRoleUpdate, invalidRoleError })
    
    // 5. Try updating a different field to test if updates work at all
    const { data: nameUpdate, error: nameError } = await supabaseAdmin
      .from('users')
      .update({ full_name: targetUser.full_name + ' (test)' })
      .eq('id', userId)
      .select('*')
    
    console.log('Name update test:', { nameUpdate, nameError })
    
    // 6. Revert name change
    const { data: nameRevert, error: nameRevertError } = await supabaseAdmin
      .from('users')
      .update({ full_name: targetUser.full_name })
      .eq('id', userId)
      .select('*')
    
    console.log('Name revert:', { nameRevert, nameRevertError })
    
    console.log('=== RLS DEBUG COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      tests: {
        userLookup: { user, userError },
        sameRoleUpdate: { sameRoleUpdate, sameRoleError },
        differentRoleUpdate: { differentRoleUpdate, differentRoleError },
        invalidRoleUpdate: { invalidRoleUpdate, invalidRoleError },
        nameUpdate: { nameUpdate, nameError },
        nameRevert: { nameRevert, nameRevertError }
      }
    })
    
  } catch (error) {
    console.error('RLS debug error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
