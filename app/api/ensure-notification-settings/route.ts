import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get all users who don't have notification settings
    const { data: usersWithoutSettings, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .not('id', 'in', 
        supabaseAdmin
          .from('notification_settings')
          .select('user_id')
      )

    if (usersError) {
      console.error('Error finding users without settings:', usersError)
      return NextResponse.json({ error: 'Failed to find users without settings' }, { status: 500 })
    }

    console.log('Users without notification settings:', usersWithoutSettings)

    if (!usersWithoutSettings || usersWithoutSettings.length === 0) {
      return NextResponse.json({ 
        message: 'All users already have notification settings',
        usersProcessed: 0
      })
    }

    // Create default notification settings for users who don't have them
    const defaultSettings = usersWithoutSettings.map(user => ({
      user_id: user.id,
      newTicket: true,
      deleted_ticket: true,
      in_work_ticket: true,
      updatetTicket: true,
      solvedTicket: true,
      sharedWorkflow: true,
      sharedPrompt: true
    }))

    const { data: insertedSettings, error: insertError } = await supabaseAdmin
      .from('notification_settings')
      .insert(defaultSettings)
      .select()

    if (insertError) {
      console.error('Error inserting notification settings:', insertError)
      return NextResponse.json({ error: 'Failed to insert notification settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Notification settings created successfully',
      usersProcessed: insertedSettings?.length || 0,
      settings: insertedSettings
    })

  } catch (error) {
    console.error('Error in ensure notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
