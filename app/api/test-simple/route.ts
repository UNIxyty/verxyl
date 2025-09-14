import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== SIMPLE TEST START ===')
    
    // Check configuration
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
          isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
        }
      })
    }
    
    console.log('Supabase is configured, testing simple insert...')
    
    // Test simple insert without joins
    // Using valid UUID format for testing
    const testData = {
      title: 'Test Ticket',
      urgency: 'low' as const,
      details: 'This is a test ticket',
      assigned_to: '00000000-0000-0000-0000-000000000001',
      created_by: '00000000-0000-0000-0000-000000000002',
      status: 'new' as const
    }
    
    console.log('Inserting test data:', testData)
    
    const { data, error } = await supabase
      .from('tickets')
      .insert(testData)
      .select()
      .single()
    
    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({
        error: 'Database insert failed',
        details: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      })
    }
    
    console.log('Insert successful:', data)
    
    // Clean up - delete the test record
    await supabase
      .from('tickets')
      .delete()
      .eq('id', data.id)
    
    console.log('=== SIMPLE TEST SUCCESS ===')
    return NextResponse.json({
      success: true,
      message: 'Simple insert test passed',
      insertedData: data
    })
    
  } catch (error) {
    console.error('=== SIMPLE TEST ERROR ===', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
  }
}
