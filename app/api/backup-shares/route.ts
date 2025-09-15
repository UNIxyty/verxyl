import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { sendNewWebhook } from '@/lib/new-webhook'

// GET - Fetch backup shares for current user
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') // 'shared_by_me', 'shared_with_me', or 'all'

    let query = supabaseAdmin
      .from('backup_shares')
      .select(`
        *,
        shared_by_user:users!backup_shares_shared_by_fkey(id, email, full_name, role),
        shared_with_user:users!backup_shares_shared_with_fkey(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false })

    if (type === 'shared_by_me') {
      query = query.eq('shared_by', user.id)
    } else if (type === 'shared_with_me') {
      query = query.eq('shared_with', user.id)
    } else {
      // All shares (both directions)
      query = query.or(`shared_by.eq.${user.id},shared_with.eq.${user.id}`)
    }

    const { data: shares, error } = await query

    if (error) {
      console.error('Error fetching backup shares:', error)
      return NextResponse.json({ error: 'Failed to fetch backup shares' }, { status: 500 })
    }

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Unexpected error in backup shares GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new backup share
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { backup_id, backup_type, shared_with, message } = await request.json()

    if (!backup_id || !backup_type || !shared_with) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ai_backup', 'n8n_workflow'].includes(backup_type)) {
      return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 })
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', shared_with)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Create the backup share
    const { data: share, error: insertError } = await supabaseAdmin
      .from('backup_shares')
      .insert({
        backup_id,
        backup_type,
        shared_by: user.id,
        shared_with,
        message
      })
      .select(`
        *,
        shared_by_user:users!backup_shares_shared_by_fkey(id, email, full_name, role),
        shared_with_user:users!backup_shares_shared_with_fkey(id, email, full_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Error creating backup share:', insertError)
      return NextResponse.json({ error: 'Failed to share backup' }, { status: 500 })
    }

    // Send notification mail to recipient
    try {
      const subject = `${backup_type === 'ai_backup' ? 'AI Backup' : 'N8N Workflow'} shared with you`
      const content = `${user.user_metadata?.full_name || user.email} has shared a ${backup_type === 'ai_backup' ? 'AI backup' : 'N8N workflow'} with you.${message ? `\n\nMessage: ${message}` : ''}`

      await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: shared_with,
          subject,
          content,
          mail_type: 'backup_share',
          related_id: share.id,
          related_type: 'backup_share'
        })
      })
    } catch (mailError) {
      console.error('Error sending notification mail:', mailError)
      // Don't fail the request if mail fails
    }

    // Send webhook notification
    try {
      await sendNewWebhook({
        action: 'role_changed', // We'll extend this for backup sharing
        timestamp: new Date().toISOString(),
        user_id: shared_with,
        user_email: recipient.email,
        user_name: recipient.full_name || recipient.email,
        admin_id: user.id,
        admin_email: user.email,
        admin_name: user.user_metadata?.full_name || user.email,
        // Add backup-specific fields later
      })
    } catch (webhookError) {
      console.error('Webhook error for backup share:', webhookError)
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({ share, message: 'Backup shared successfully' })
  } catch (error) {
    console.error('Unexpected error in backup shares POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
