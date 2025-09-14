import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== SETUP ADMIN SETTINGS ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }
    
    const results = []
    
    // 1. Create admin_settings table if it doesn't exist
    try {
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      
      if (createError) {
        console.log('Table creation result:', createError.message)
        // Table might already exist, continue
      }
      
      results.push({
        step: 'create_table',
        result: createError ? 'EXISTS_OR_ERROR' : 'CREATED',
        error: createError?.message
      })
    } catch (error) {
      results.push({
        step: 'create_table',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // 2. Add missing columns if they don't exist
    try {
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS description TEXT;
          ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `
      })
      
      results.push({
        step: 'add_columns',
        result: alterError ? 'ERROR' : 'SUCCESS',
        error: alterError?.message
      })
    } catch (error) {
      results.push({
        step: 'add_columns',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // 3. Enable RLS
    try {
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;`
      })
      
      results.push({
        step: 'enable_rls',
        result: rlsError ? 'ERROR' : 'SUCCESS',
        error: rlsError?.message
      })
    } catch (error) {
      results.push({
        step: 'enable_rls',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // 4. Insert default webhook URL if it doesn't exist
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'webhook_url',
          setting_value: '',
          description: 'Webhook URL for sending ticket notifications'
        }, {
          onConflict: 'setting_key'
        })
        .select()
      
      results.push({
        step: 'insert_webhook_url',
        result: insertError ? 'ERROR' : 'SUCCESS',
        data: insertData,
        error: insertError?.message
      })
    } catch (error) {
      results.push({
        step: 'insert_webhook_url',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // 5. Test the setup by reading the webhook URL
    try {
      const { data: testData, error: testError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_url')
        .single()
      
      results.push({
        step: 'test_read',
        result: testError ? 'ERROR' : 'SUCCESS',
        data: testData,
        error: testError?.message
      })
    } catch (error) {
      results.push({
        step: 'test_read',
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    console.log('Setup results:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Admin settings setup completed',
      results
    })
    
  } catch (error) {
    console.error('=== SETUP ERROR ===', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
