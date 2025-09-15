import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== TESTING RLS STATUS ===')
    
    // Check RLS status on tickets table
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('tablename', 'tickets')
      .eq('schemaname', 'public')
    
    console.log('RLS Status:', rlsStatus)
    console.log('RLS Error:', rlsError)
    
    // Check existing policies
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'tickets')
      .eq('schemaname', 'public')
    
    console.log('Policies:', policies)
    console.log('Policies Error:', policiesError)
    
    // Test a simple select operation
    const { data: testSelect, error: selectError } = await supabaseAdmin
      .from('tickets')
      .select('id, title')
      .limit(1)
    
    console.log('Test Select:', testSelect)
    console.log('Select Error:', selectError)
    
    // Test a simple update operation
    const { data: testUpdate, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', 'c169de58-0e76-4e04-b5cb-57886406bbcf')
      .select('id')
    
    console.log('Test Update:', testUpdate)
    console.log('Update Error:', updateError)
    
    return NextResponse.json({
      success: true,
      rlsStatus: rlsStatus,
      policies: policies,
      testSelect: {
        data: testSelect,
        error: selectError
      },
      testUpdate: {
        data: testUpdate,
        error: updateError
      }
    })
    
  } catch (error) {
    console.error('RLS Status Test Error:', error)
    return NextResponse.json({
      error: 'RLS status test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
