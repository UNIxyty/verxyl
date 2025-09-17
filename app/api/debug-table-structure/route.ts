import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if notification_settings table exists
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'notification_settings')
      .eq('table_schema', 'public')

    if (tableError) {
      console.error('Error checking table existence:', tableError)
      return NextResponse.json({ error: 'Failed to check table existence' }, { status: 500 })
    }

    // Check table columns
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'notification_settings')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columnsError) {
      console.error('Error checking table columns:', columnsError)
      return NextResponse.json({ error: 'Failed to check table columns' }, { status: 500 })
    }

    // Check if there are any records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .limit(5)

    if (recordsError) {
      console.error('Error checking records:', recordsError)
      return NextResponse.json({ error: 'Failed to check records' }, { status: 500 })
    }

    return NextResponse.json({ 
      tableExists: tableInfo && tableInfo.length > 0,
      columns: columns || [],
      sampleRecords: records || [],
      recordCount: records ? records.length : 0
    })

  } catch (error) {
    console.error('Error in debug table structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
