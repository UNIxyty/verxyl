import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { sendNewWebhook } from '@/lib/new-webhook'

// GET - Fetch user's mails (inbox and sent)
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
    const type = url.searchParams.get('type') // 'inbox', 'sent', or 'all'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('mails')
      .select(`
        *,
        sender:users!mails_sender_id_fkey(id, email, full_name, role),
        recipient:users!mails_recipient_id_fkey(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type === 'inbox') {
      query = query.eq('recipient_id', user.id)
    } else if (type === 'sent') {
      query = query.eq('sender_id', user.id)
    } else {
      // All mails (inbox + sent)
      query = query.or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
    }

    const { data: mails, error } = await query

    if (error) {
      console.error('Error fetching mails:', error)
      return NextResponse.json({ error: 'Failed to fetch mails' }, { status: 500 })
    }

    return NextResponse.json({ mails })
  } catch (error) {
    console.error('Unexpected error in mails GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send a new mail
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

    const { recipient_id, subject, content, mail_type = 'message', related_id, related_type } = await request.json()

    if (!recipient_id || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify recipient exists (use admin to avoid RLS issues)
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Create the mail
    const { data: mail, error: insertError } = await supabase
      .from('mails')
      .insert({
        sender_id: user.id,
        recipient_id,
        subject,
        content,
        mail_type,
        related_id,
        related_type
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating mail:', insertError)
      return NextResponse.json({ error: 'Failed to send mail', details: insertError.message, code: insertError.code }, { status: 500 })
    }

    // Send webhook notification for new mail
    try {
      await sendNewWebhook({
        action: 'role_changed', // We'll extend this for mail notifications
        timestamp: new Date().toISOString(),
        user_id: recipient_id,
        user_email: recipient.email,
        user_name: recipient.full_name || recipient.email,
        admin_id: user.id,
        admin_email: user.email,
        admin_name: user.user_metadata?.full_name || user.email,
        // We'll add mail-specific fields later
      })
    } catch (webhookError) {
      console.error('Webhook error for new mail:', webhookError)
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({ mail, message: 'Mail sent successfully' })
  } catch (error) {
    console.error('Unexpected error in mails POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
