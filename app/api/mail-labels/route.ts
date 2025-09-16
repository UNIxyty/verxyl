import { NextRequest, NextResponse } from 'next/server'
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching labels:', error)
      return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
    }

    return NextResponse.json({ labels: labels || [] })

  } catch (error) {
    console.error('Unexpected error in labels GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}

// POST - Create new mail label
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

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    // Check if label with same name already exists for this user
    const { data: existingLabel } = await supabase
      .from('mail_labels')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single()

    if (existingLabel) {
      return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 })
    }

    const { data: label, error } = await supabase
      .from('mail_labels')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color: color
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating label:', error)
      return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
    }

    return NextResponse.json({ label, message: 'Label created successfully' })

  } catch (error) {
    console.error('Unexpected error in labels POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}