import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG N8N BACKUPS START ===')
    
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 })
    }

    // Test table existence
    console.log('Testing table existence...')
    const { data: tableTest, error: tableError } = await supabaseAdmin
      .from('n8n_project_backups')
      .select('count')
      .limit(1)
    
    console.log('Table test result:', { tableTest, tableError })

    // Test RLS status
    console.log('Testing RLS...')
    const { data: rlsTest, error: rlsError } = await supabaseAdmin
      .from('n8n_project_backups')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
    
    console.log('RLS test result:', { rlsTest, rlsError })

    // Test insert with minimal data
    console.log('Testing insert...')
    const testData = {
      user_id: user.id,
      project_name: 'Test Project',
      workflow_json: { test: true },
      description: 'Test description'
    }
    
    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('n8n_project_backups')
      .insert(testData)
      .select()
      .single()
    
    console.log('Insert test result:', { insertTest, insertError })

    // Clean up test data
    if (insertTest) {
      await supabaseAdmin
        .from('n8n_project_backups')
        .delete()
        .eq('id', insertTest.id)
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      tableTest: { success: !tableError, error: tableError },
      rlsTest: { success: !rlsError, error: rlsError },
      insertTest: { success: !insertError, error: insertError, data: insertTest }
    })

  } catch (error) {
    console.error('=== DEBUG N8N BACKUPS ERROR ===', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
