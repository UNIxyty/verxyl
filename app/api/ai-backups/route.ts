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

    // Fetch AI prompt backups for the current user
    const { data: backups, error } = await supabaseAdmin
      .from('ai_prompt_backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching AI prompt backups:', error)
      return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
    }

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
