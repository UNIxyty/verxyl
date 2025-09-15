import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING TABLE ACCESS ===')
    
    // Test 1: Try to select from table
    const { data: selectResult, error: selectError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .limit(5)

    console.log('Select test:', { selectResult, selectError })

    // Test 2: Try to insert a simple record
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('system_settings')
      .insert({
        setting_key: 'test_setting',
        setting_value: 'test_value',
        setting_description: 'Test setting',
        setting_type: 'string'
      })
      .select()

    console.log('Insert test:', { insertResult, insertError })

    // Test 3: Try to select the test record
    const { data: testSelect, error: testSelectError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'test_setting')
      .single()

    console.log('Test select:', { testSelect, testSelectError })

    // Test 4: Try to delete the test record
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .from('system_settings')
      .delete()
      .eq('setting_key', 'test_setting')
      .select()

    console.log('Delete test:', { deleteResult, deleteError })

    return NextResponse.json({
      success: true,
      tests: {
        select: {
          result: selectResult,
          error: selectError,
          count: selectResult?.length || 0
        },
        insert: {
          result: insertResult,
          error: insertError
        },
        testSelect: {
          result: testSelect,
          error: testSelectError
        },
        delete: {
          result: deleteResult,
          error: deleteError
        }
      }
    })

  } catch (error) {
    console.error('Test table access error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
