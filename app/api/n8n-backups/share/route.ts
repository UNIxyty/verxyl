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
      .from('n8n_project_backups')
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
      .from('n8n_backup_shares')
      .select('id')
      .eq('backup_id', backup_id)
      .eq('recipient_id', recipient.id)
      .single()

    if (existingShare) {
      return NextResponse.json({ error: 'Backup already shared with this user' }, { status: 400 })
    }

    // Create the share record
    const { data: share, error: shareError } = await supabaseAdmin
      .from('n8n_backup_shares')
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
      console.error('Error creating N8N backup share:', shareError)
      return NextResponse.json({ error: 'Failed to share backup' }, { status: 500 })
    }

    // Send webhook for shared N8N workflow
    try {
      const { sendNewWebhook, getUserNotificationSettings } = await import('@/lib/new-webhook')
      const notificationSettings = await getUserNotificationSettings(recipient.id)
      
      await sendNewWebhook({
        action: 'sharedWorkflow',
        timestamp: new Date().toISOString(),
        user_id: recipient.id,
        user_email: recipient.email,
        user_name: recipient.full_name || recipient.email,
        backup_id: backup_id,
        backup_title: backup.title,
        backup_type: 'n8n_workflow',
        shared_by_id: user.id,
        shared_by_email: user.email || '',
        shared_by_name: user.user_metadata?.full_name || user.email || 'User',
        access_role: access_role,
        // Add notification settings as direct parameters
        newTicket: notificationSettings?.newTicket,
        deleted_ticket: notificationSettings?.deleted_ticket,
        in_work_ticket: notificationSettings?.in_work_ticket,
        updatetTicket: notificationSettings?.updatetTicket,
        solvedTicket: notificationSettings?.solvedTicket,
        sharedWorkflow: notificationSettings?.sharedWorkflow,
        sharedPrompt: notificationSettings?.sharedPrompt
      })
    } catch (webhookError) {
      console.error('Webhook error for shared N8N workflow:', webhookError)
      // Don't fail the request if webhook fails
    }

    // Create notification for the recipient
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipient.id,
        title: 'N8N Workflow Shared',
        message: `${user.user_metadata?.full_name || user.email} shared an N8N workflow with you`,
        type: 'shared_n8n_workflow',
        redirect_path: '/n8n-backups',
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
    console.error('Error in N8N backup share:', error)
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
        .from('n8n_backup_shares')
        .select(`
          *,
          n8n_project_backups!inner(*),
          users!n8n_backup_shares_owner_id_fkey(id, email, full_name)
        `)
        .eq('recipient_id', user.id)
    } else {
      // Get backups shared by the current user
      query = supabaseAdmin
        .from('n8n_backup_shares')
        .select(`
          *,
          n8n_project_backups!inner(*),
          users!n8n_backup_shares_recipient_id_fkey(id, email, full_name)
        `)
        .eq('owner_id', user.id)
    }

    const { data: shares, error } = await query.order('shared_at', { ascending: false })

    if (error) {
      console.error('Error fetching N8N backup shares:', error)
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    return NextResponse.json({ shares })

  } catch (error) {
    console.error('Error in N8N backup shares GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
