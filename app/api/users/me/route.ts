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
      'solved_ticket', 'shared_workflow', 'shared_prompt'
    ]
    
    const filteredBody = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key]
        return obj
      }, {} as any)
    
    // Update user data in users table
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(filteredBody)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user data:', error)
      return NextResponse.json({ 
        error: 'Failed to update user data', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('Error in users/me PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
