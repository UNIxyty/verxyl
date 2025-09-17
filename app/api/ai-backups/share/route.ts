import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { backup_id, recipient_email, access_role = 'viewer' } = body

    if (!backup_id || !recipient_email) {
      return NextResponse.json({ error: 'Backup ID and recipient email are required' }, { status: 400 })
    }

    // Validate access role
    if (!['viewer', 'editor'].includes(access_role)) {
      return NextResponse.json({ error: 'Access role must be either "viewer" or "editor"' }, { status: 400 })
    }

    // Verify the backup exists and belongs to the user
    const { data: backup, error: backupError } = await supabaseAdmin
      .from('ai_prompt_backups')
      .select('*')
      .eq('id', backup_id)
      .eq('user_id', user.id)
      .single()

    if (backupError || !backup) {
      return NextResponse.json({ error: 'Backup not found or access denied' }, { status: 404 })
    }

    // Find the recipient user
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('email', recipient_email)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 })
    }

    // Check if backup is already shared with this user
    const { data: existingShare, error: shareCheckError } = await supabaseAdmin
      .from('ai_backup_shares')
      .select('id')
      .eq('backup_id', backup_id)
      .eq('recipient_id', recipient.id)
      .single()

    if (existingShare) {
      return NextResponse.json({ error: 'Backup already shared with this user' }, { status: 400 })
    }

    // Create the share record
    const { data: share, error: shareError } = await supabaseAdmin
      .from('ai_backup_shares')
      .insert({
        backup_id: backup_id,
        owner_id: user.id,
        recipient_id: recipient.id,
        access_role: access_role,
        shared_at: new Date().toISOString()
      })
      .select()
      .single()

    if (shareError) {
      console.error('Error creating AI backup share:', shareError)
      return NextResponse.json({ error: 'Failed to share backup' }, { status: 500 })
    }


    // Create notification for the recipient
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipient.id,
        title: 'AI Prompt Backup Shared',
        message: `${user.user_metadata?.full_name || user.email} shared an AI prompt backup with you`,
        type: 'shared_ai_backup',
        redirect_path: '/ai-backups',
        is_read: false
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({ 
      share,
      recipient: {
        id: recipient.id,
        email: recipient.email,
        full_name: recipient.full_name
      }
    })

  } catch (error) {
    console.error('Error in AI backup share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const type = searchParams.get('type') // 'shared_with_me' or 'shared_by_me'

    let query
    if (type === 'shared_with_me') {
      // Get backups shared with the current user
      query = supabaseAdmin
        .from('ai_backup_shares')
        .select(`
          *,
          ai_prompt_backups!inner(*),
          users!ai_backup_shares_owner_id_fkey(id, email, full_name)
        `)
        .eq('recipient_id', user.id)
    } else {
      // Get backups shared by the current user
      query = supabaseAdmin
        .from('ai_backup_shares')
        .select(`
          *,
          ai_prompt_backups!inner(*),
          users!ai_backup_shares_recipient_id_fkey(id, email, full_name)
        `)
        .eq('owner_id', user.id)
    }

    const { data: shares, error } = await query.order('shared_at', { ascending: false })

    if (error) {
      console.error('Error fetching AI backup shares:', error)
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    return NextResponse.json({ shares })

  } catch (error) {
    console.error('Error in AI backup shares GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
