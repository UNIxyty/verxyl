import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch notification settings for a user
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's notification settings
    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      newTicket: true,
      deleted_ticket: true,
      in_work_ticket: true,
      updatetTicket: true,
      solvedTicket: true,
      sharedWorkflow: true,
      sharedPrompt: true
    }

    return NextResponse.json({ 
      settings: settings || defaultSettings 
    })

  } catch (error) {
    console.error('Error in notification settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save notification settings for a user
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const settings = body

    // Validate settings object
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 })
    }

    // Upsert notification settings
    const { data, error } = await supabaseAdmin
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving notification settings:', error)
      return NextResponse.json({ error: 'Failed to save notification settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Notification settings saved successfully',
      settings: data
    })

  } catch (error) {
    console.error('Error in notification settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}