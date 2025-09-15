import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing system_settings table access...')
    
    // Test if system_settings table exists
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error accessing system_settings table:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    return NextResponse.json({
      success: true,
      message: 'system_settings table is accessible',
      tableExists: true,
      rowCount: data?.length || 0,
      sampleData: data
    })

  } catch (error) {
    console.error('Test system settings error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
