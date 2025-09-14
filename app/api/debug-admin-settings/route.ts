import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== DEBUG ADMIN SETTINGS ===')
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: isSupabaseConfigured(),
      tests: []
    }
    
    if (!isSupabaseConfigured()) {
      debug.tests.push({ test: 'supabase_config', result: 'FAILED - Supabase not configured' })
      return NextResponse.json(debug)
    }
    
    // Test 1: Check if admin_settings table exists
    try {
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'admin_settings')
      
      debug.tests.push({
        test: 'table_exists',
        result: tableError ? 'FAILED' : 'SUCCESS',
        data: tables,
        error: tableError?.message
      })
    } catch (error) {
      debug.tests.push({
        test: 'table_exists',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 2: Try to select from admin_settings
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
      
      debug.tests.push({
        test: 'select_all',
        result: error ? 'FAILED' : 'SUCCESS',
        data: data,
        error: error?.message,
        count: data?.length || 0
      })
    } catch (error) {
      debug.tests.push({
        test: 'select_all',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 3: Try to select webhook_url setting
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_url')
        .single()
      
      debug.tests.push({
        test: 'select_webhook_url',
        result: error ? 'FAILED' : 'SUCCESS',
        data: data,
        error: error?.message
      })
    } catch (error) {
      debug.tests.push({
        test: 'select_webhook_url',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    console.log('Debug results:', debug)
    return NextResponse.json(debug)
    
  } catch (error) {
    console.error('=== DEBUG ERROR ===', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
