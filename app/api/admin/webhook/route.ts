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

    // Get webhook URL from database (fallback to environment variable)
    let webhookUrl = ''
    let usingFallback = false
    
    try {
      const { data: webhookSetting, error: webhookError } = await supabaseAdmin
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_url')
        .single()

      if (webhookError) {
        console.log('Database table not found or error, falling back to environment variable:', webhookError.message)
        webhookUrl = process.env.WEBHOOK_URL || ''
        usingFallback = true
      } else {
        webhookUrl = webhookSetting?.setting_value || ''
      }
    } catch (error) {
      console.log('Error accessing system_settings table, falling back to environment variable:', error)
      webhookUrl = process.env.WEBHOOK_URL || ''
      usingFallback = true
    }
    
    return NextResponse.json({
      webhookUrl,
      isConfigured: !!webhookUrl,
      usingFallback,
      message: usingFallback ? 'Using environment variable (database table not found)' : 'Using database setting'
    })

  } catch (error) {
    console.error('Webhook GET error:', error)
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

    const { webhookUrl } = await request.json()

    // Validate webhook URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
    }

    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 })
    }

    // Test the webhook URL
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'Webhook URL test from Verxyl Ticket System',
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!testResponse.ok) {
        return NextResponse.json({ 
          error: 'Webhook test failed', 
          details: `HTTP ${testResponse.status}: ${testResponse.statusText}` 
        }, { status: 400 })
      }

    } catch (testError) {
      return NextResponse.json({ 
        error: 'Webhook test failed', 
        details: testError instanceof Error ? testError.message : 'Unknown error' 
      }, { status: 400 })
    }

    // Try to save webhook URL to database (if table exists)
    try {
      const { data: existingSetting, error: existingError } = await supabaseAdmin
        .from('system_settings')
        .select('id')
        .eq('setting_key', 'webhook_url')
        .single()

      if (existingSetting) {
        // Update existing setting
        const { error: updateError } = await supabaseAdmin
          .from('system_settings')
          .update({ 
            setting_value: webhookUrl,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'webhook_url')

        if (updateError) {
          console.error('Error updating webhook setting:', updateError)
          return NextResponse.json({ 
            success: true,
            message: 'Webhook URL validated successfully, but could not save to database. Please run the database setup script.',
            webhookUrl,
            warning: 'Database table not found - changes not persisted'
          })
        }
      } else {
        // Insert new setting
        const { error: insertError } = await supabaseAdmin
          .from('system_settings')
          .insert({
            setting_key: 'webhook_url',
            setting_value: webhookUrl,
            setting_description: 'Webhook URL for ticket notifications',
            setting_type: 'url',
            created_by: user.id,
            updated_by: user.id
          })

        if (insertError) {
          console.error('Error inserting webhook setting:', insertError)
          return NextResponse.json({ 
            success: true,
            message: 'Webhook URL validated successfully, but could not save to database. Please run the database setup script.',
            webhookUrl,
            warning: 'Database table not found - changes not persisted'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook URL saved and validated successfully!',
        webhookUrl
      })

    } catch (error) {
      console.error('Error accessing system_settings table:', error)
      return NextResponse.json({ 
        success: true,
        message: 'Webhook URL validated successfully, but could not save to database. Please run the database setup script.',
        webhookUrl,
        warning: 'Database table not found - changes not persisted'
      })
    }

  } catch (error) {
    console.error('Webhook POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
