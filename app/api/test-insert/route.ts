import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== TEST INSERT START ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      })
    }
    
    // Test simple insert without any joins or complex operations
    const testData = {
      title: 'Test Ticket ' + Date.now(),
      urgency: 'low' as const,
      details: 'This is a test ticket to verify RLS status',
      assigned_to: 'dd02c4ba-58db-4223-a9c7-abf7975bb249',
      created_by: 'fbbc5913-1540-42ef-b333-65e1654160b8',
      status: 'new' as const
    }
    
    console.log('Attempting insert with data:', testData)
    
    const { data, error } = await supabase
      .from('tickets')
      .insert(testData)
      .select()
      .single()
    
    if (error) {
      console.error('Insert failed:', error)
      return NextResponse.json({
        error: 'Insert failed',
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
    
    return NextResponse.json({
      success: true,
      message: 'Test insert successful - RLS is disabled or working properly',
      testData: data
    })
    
  } catch (error) {
    console.error('=== TEST INSERT ERROR ===', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
