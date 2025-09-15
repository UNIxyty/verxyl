import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch user's notification settings
export async function GET() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
    }

    // If no settings exist, return default settings
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        new_ticket: true,
        updated_ticket: true,
        deleted_ticket: true,
        solved_ticket: true,
        in_work_ticket: true,
        shared_ai_backup: true,
        shared_n8n_workflow: true,
        new_mail: true
      }
      return NextResponse.json({ settings: defaultSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Unexpected error in notification settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT - Update user's notification settings
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const settingsData = await request.json()

    // Validate the settings data
    const validKeys = [
      'new_ticket', 'updated_ticket', 'deleted_ticket', 'solved_ticket', 
      'in_work_ticket', 'shared_ai_backup', 'shared_n8n_workflow', 'new_mail'
    ]

    const filteredSettings = {}
    for (const key of validKeys) {
      if (key in settingsData && typeof settingsData[key] === 'boolean') {
        filteredSettings[key] = settingsData[key]
      }
    }

    if (Object.keys(filteredSettings).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 })
    }

    // Upsert notification settings
    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...filteredSettings,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error updating notification settings:', error)
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
    }

    return NextResponse.json({ settings, message: 'Notification settings updated successfully' })
  } catch (error) {
    console.error('Unexpected error in notification settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
