import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all system settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .order('setting_key')

    if (settingsError) {
      console.error('Error fetching system settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('System settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { setting_key, setting_value, setting_description, setting_type } = await request.json()

    // Validate required fields
    if (!setting_key || !setting_value) {
      return NextResponse.json({ error: 'Setting key and value are required' }, { status: 400 })
    }

    // Check if setting already exists
    const { data: existingSetting, error: existingError } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .eq('setting_key', setting_key)
      .single()

    if (existingSetting) {
      // Update existing setting
      const { data, error: updateError } = await supabaseAdmin
        .from('system_settings')
        .update({ 
          setting_value,
          setting_description: setting_description || null,
          setting_type: setting_type || 'string',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', setting_key)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating system setting:', updateError)
        return NextResponse.json({ error: 'Failed to update system setting' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'System setting updated successfully',
        setting: data
      })
    } else {
      // Insert new setting
      const { data, error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          setting_key,
          setting_value,
          setting_description: setting_description || null,
          setting_type: setting_type || 'string',
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting system setting:', insertError)
        return NextResponse.json({ error: 'Failed to create system setting' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'System setting created successfully',
        setting: data
      })
    }

  } catch (error) {
    console.error('System settings POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const settingKey = searchParams.get('key')

    if (!settingKey) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    // Delete the setting
    const { error: deleteError } = await supabaseAdmin
      .from('system_settings')
      .delete()
      .eq('setting_key', settingKey)

    if (deleteError) {
      console.error('Error deleting system setting:', deleteError)
      return NextResponse.json({ error: 'Failed to delete system setting' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'System setting deleted successfully'
    })

  } catch (error) {
    console.error('System settings DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
