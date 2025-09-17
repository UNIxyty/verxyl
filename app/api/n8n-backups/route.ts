import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
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

    // Fetch N8N project backups for the current user
    const { data: backups, error } = await supabaseAdmin
      .from('n8n_project_backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching N8N project backups:', error)
      return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
    }

    return NextResponse.json({ backups: backups || [] })

  } catch (error) {
    console.error('Error in N8N backups GET:', error)
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_name, workflow_json, description } = body

    if (!project_name || !workflow_json) {
      return NextResponse.json({ error: 'Project name and workflow JSON are required' }, { status: 400 })
    }

    // Create new N8N project backup
    const { data: backup, error } = await supabaseAdmin
      .from('n8n_project_backups')
      .insert({
        user_id: user.id,
        project_name,
        workflow_json,
        description: description || null,
        previous_version_id: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating N8N project backup:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'Failed to create backup',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ backup })

  } catch (error) {
    console.error('Error in N8N backups POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, project_name, workflow_json, description } = body

    if (!id) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 })
    }

    // Update N8N project backup
    const { data: backup, error } = await supabaseAdmin
      .from('n8n_project_backups')
      .update({
        project_name: project_name || undefined,
        workflow_json: workflow_json || undefined,
        description: description || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating N8N project backup:', error)
      return NextResponse.json({ error: 'Failed to update backup' }, { status: 500 })
    }

    return NextResponse.json({ backup })

  } catch (error) {
    console.error('Error in N8N backups PUT:', error)
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 })
    }

    // Delete N8N project backup
    const { error } = await supabaseAdmin
      .from('n8n_project_backups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting N8N project backup:', error)
      return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Backup deleted successfully' })

  } catch (error) {
    console.error('Error in N8N backups DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
