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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from users table
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user data:', error)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    return NextResponse.json({ user: userData })

  } catch (error) {
    console.error('Error in users/me GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    
        // Filter out any invalid fields that might cause issues
        const allowedFields = [
          'new_ticket', 'deleted_ticket', 'in_work_ticket', 'updated_ticket', 
          'solved_ticket', 'shared_workflow', 'shared_prompt', 'webhook_url',
          'webhook_base_url', 'webhook_tickets_path', 'webhook_users_path'
        ]
    
    const filteredBody = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key]
        return obj
      }, {} as any)

    // If no valid fields to update, return success
    if (Object.keys(filteredBody).length === 0) {
      return NextResponse.json({ 
        user: { id: user.id },
        message: 'No valid fields to update'
      })
    }
    
    // Try to update user data in users table
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(filteredBody)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user data:', error)
      
      // If the error is about missing columns, provide a helpful message
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database columns not found. Please run the database migration script first.',
          details: error.message,
          suggestion: 'Run add-notification-columns-to-users.sql in your Supabase SQL editor'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update user data', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('Error in users/me PATCH:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
