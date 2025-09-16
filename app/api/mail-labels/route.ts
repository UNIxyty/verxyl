import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch user's mail labels
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: labels, error } = await supabase
      .from('mail_labels')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching mail labels:', error)
      return NextResponse.json({ error: 'Failed to fetch labels', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Unexpected error in mail labels GET:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// POST - Create a new mail label
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { name, color = '#3B82F6' } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    const { data: label, error: insertError } = await supabase
      .from('mail_labels')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating mail label:', insertError)
      return NextResponse.json({ error: 'Failed to create label', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ label, message: 'Label created successfully' })
  } catch (error) {
    console.error('Unexpected error in mail labels POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
