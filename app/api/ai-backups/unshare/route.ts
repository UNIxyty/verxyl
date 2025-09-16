import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { share_id } = await request.json()

    if (!share_id) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Verify the user owns the backup being unshared
    const { data: shareRecord, error: shareError } = await supabaseAdmin
      .from('ai_backup_shares')
      .select(`
        id,
        backup:ai_prompt_backups!backup_id (
          id,
          user_id
        )
      `)
      .eq('id', share_id)
      .single()

    if (shareError || !shareRecord) {
      return NextResponse.json({ error: 'Share record not found' }, { status: 404 })
    }

    // Check if the current user is the owner of the backup
    const backup = shareRecord.backup as { id: string; user_id: string }
    if (backup.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only remove access to your own backups' }, { status: 403 })
    }

    // Remove the share record
    const { error: deleteError } = await supabaseAdmin
      .from('ai_backup_shares')
      .delete()
      .eq('id', share_id)

    if (deleteError) {
      console.error('Error removing share:', deleteError)
      return NextResponse.json({ error: 'Failed to remove access' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Access removed successfully' })

  } catch (error) {
    console.error('Error in DELETE unshare API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
