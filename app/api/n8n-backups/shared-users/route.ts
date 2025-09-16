import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
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

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('backup_id')

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 })
    }

    // Get shared users for this backup
    const { data: sharedUsers, error } = await supabaseAdmin
      .from('n8n_backup_shares')
      .select(`
        id,
        access_role,
        shared_at,
        recipient:users!recipient_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('backup_id', backupId)
      .order('shared_at', { ascending: false })

    if (error) {
      console.error('Error fetching shared users:', error)
      return NextResponse.json({ error: 'Failed to fetch shared users' }, { status: 500 })
    }

    return NextResponse.json({ sharedUsers })

  } catch (error) {
    console.error('Error in GET shared users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
