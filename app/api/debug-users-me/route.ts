import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authError }, { status: 401 })
    }

    const body = await request.json()
    
    // First, let's check what columns exist in the users table
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(async () => {
        // Fallback: try to get user data to see what columns are available
        const { data: userData, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        return { data: userData ? Object.keys(userData) : null, error }
      })

    // Check if notification columns exist
    const notificationColumns = [
      'new_ticket', 'deleted_ticket', 'in_work_ticket', 
      'updated_ticket', 'solved_ticket', 'shared_workflow', 'shared_prompt'
    ]
    
    const existingColumns = Array.isArray(columns) ? columns : (columns ? Object.keys(columns) : [])
    const missingColumns = notificationColumns.filter(col => !existingColumns.includes(col))

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      requestBody: body,
      existingColumns: existingColumns,
      missingColumns: missingColumns,
      allColumnsExist: missingColumns.length === 0,
      columnsError: columnsError?.message
    })

  } catch (error) {
    console.error('Error in debug users/me:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
