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

    // Fetch AI prompt backups for the current user (owned + shared)
    const { data: ownedBackups, error: ownedError } = await supabaseAdmin
      .from('ai_prompt_backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching owned AI prompt backups:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch owned backups' }, { status: 500 })
    }

    // Fetch shared AI prompt backups
    const { data: sharedBackups, error: sharedError } = await supabaseAdmin
      .from('ai_prompt_backups')
      .select(`
        *,
        ai_backup_shares!inner(access_role, shared_at)
      `)
      .eq('ai_backup_shares.recipient_id', user.id)
      .order('created_at', { ascending: false })

    if (sharedError) {
      console.error('Error fetching shared AI prompt backups:', sharedError)
      return NextResponse.json({ error: 'Failed to fetch shared backups' }, { status: 500 })
    }

    // Combine owned and shared backups
    const allBackups = [
      ...(ownedBackups || []).map(backup => ({ ...backup, is_shared: false })),
      ...(sharedBackups || []).map(backup => ({ ...backup, is_shared: true }))
    ]

    // Sort by creation date
    const backups = allBackups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ backups: backups || [] })

  } catch (error) {
    console.error('Error in AI backups GET:', error)
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
    const { prompt_text, ai_model, output_logic, output_result, previous_version_id } = body

    if (!prompt_text || !ai_model) {
      return NextResponse.json({ error: 'Prompt text and AI model are required' }, { status: 400 })
    }

    // Create new AI prompt backup
    const { data: backup, error } = await supabaseAdmin
      .from('ai_prompt_backups')
      .insert({
        user_id: user.id,
        prompt_text,
        ai_model,
        output_logic: output_logic || null,
        output_result: output_result || null,
        previous_version_id: previous_version_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating AI prompt backup:', error)
      return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
    }

    return NextResponse.json({ backup })

  } catch (error) {
    console.error('Error in AI backups POST:', error)
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
    const { id, prompt_text, ai_model, output_logic, output_result } = body

    if (!id) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 })
    }

    // Update AI prompt backup
    const { data: backup, error } = await supabaseAdmin
      .from('ai_prompt_backups')
      .update({
        prompt_text: prompt_text || undefined,
        ai_model: ai_model || undefined,
        output_logic: output_logic || undefined,
        output_result: output_result || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI prompt backup:', error)
      return NextResponse.json({ error: 'Failed to update backup' }, { status: 500 })
    }

    return NextResponse.json({ backup })

  } catch (error) {
    console.error('Error in AI backups PUT:', error)
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

    // Delete AI prompt backup
    const { error } = await supabaseAdmin
      .from('ai_prompt_backups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting AI prompt backup:', error)
      return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Backup deleted successfully' })

  } catch (error) {
    console.error('Error in AI backups DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
