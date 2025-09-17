import { NextResponse, NextRequest } from 'next/server'
import { getUserNotificationSettings } from '@/lib/new-webhook'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
    }

    // Clean the user ID - remove any extra characters
    userId = userId.trim().replace(/["\s]+$/, '').replace(/^["\s]+/, '')
    
    console.log('Testing notification settings for user:', userId)
    console.log('Cleaned user ID:', userId)
    
    // Test the getUserNotificationSettings function
    const notificationSettings = await getUserNotificationSettings(userId)
    
    console.log('Raw notification settings result:', notificationSettings)

    // Test direct database query
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { data: directQuery, error: directError } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('Direct query result:', { directQuery, directError })

    // Test if table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'notification_settings')
      .eq('table_schema', 'public')

    console.log('Table exists check:', { tableCheck, tableError })

    // Test if user exists
    const { data: userExists, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    console.log('User exists check:', { userExists, userError })

    return NextResponse.json({ 
      userId,
      functionResult: notificationSettings,
      directQuery: { data: directQuery, error: directError },
      tableExists: tableCheck && tableCheck.length > 0,
      userExists: { data: userExists, error: userError },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in test notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
