import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch projects
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

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const assigned_to = url.searchParams.get('assigned_to')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('projects')
      .select(`
        *,
        created_by_user:users!projects_created_by_fkey(id, email, full_name, role),
        assigned_user:users!projects_assigned_to_fkey(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }

    const { data: projects, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Unexpected error in projects GET:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// POST - Create a new project
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

    const {
      title,
      description,
      assigned_to,
      deadline,
      budget,
      priority = 'medium'
    } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 })
    }

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description,
        assigned_to,
        deadline,
        budget,
        priority,
        created_by: user.id
      })
      .select(`
        *,
        created_by_user:users!projects_created_by_fkey(id, email, full_name, role),
        assigned_user:users!projects_assigned_to_fkey(id, email, full_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Error creating project:', insertError)
      return NextResponse.json({ error: 'Failed to create project', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ project, message: 'Project created successfully' })
  } catch (error) {
    console.error('Unexpected error in projects POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
