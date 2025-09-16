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
    const type = url.searchParams.get('type') // 'inbox', 'sent', 'drafts', 'starred', 'important', 'spam', 'trash'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search') // Search in subject/content
    const label = url.searchParams.get('label') // Filter by label

    let query = supabase
      .from('mails')
      .select(`
        *,
        sender:users!mails_sender_id_fkey(id, email, full_name, role),
        recipient:users!mails_recipient_id_fkey(id, email, full_name, role),
        reply_to:reply_to_mail_id(id, subject)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters based on type
    if (type === 'inbox') {
      query = query
        .eq('recipient_id', user.id)
        .eq('is_draft', false)
        .eq('is_trash', false)
        .eq('is_spam', false)
    } else if (type === 'sent') {
      query = query
        .eq('sender_id', user.id)
        .eq('is_draft', false)
        .eq('is_trash', false)
    } else if (type === 'drafts') {
      query = query
        .eq('sender_id', user.id)
        .eq('is_draft', true)
        .eq('is_trash', false)
    } else if (type === 'starred') {
      query = query
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('is_starred', true)
        .eq('is_trash', false)
    } else if (type === 'important') {
      query = query
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('is_important', true)
        .eq('is_trash', false)
    } else if (type === 'spam') {
      query = query
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('is_spam', true)
    } else if (type === 'trash') {
      query = query
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('is_trash', true)
    } else {
      // All mails (inbox + sent, excluding drafts, spam, trash)
      query = query
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('is_draft', false)
        .eq('is_trash', false)
        .eq('is_spam', false)
    }

    // Apply search filter
    if (search) {
      query = query.or(`subject.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Apply label filter
    if (label) {
      query = query.contains('labels', [label])
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

    const { 
      recipient_id, 
      subject, 
      content, 
      mail_type = 'message', 
      related_id, 
      related_type,
      is_draft = false,
      is_starred = false,
      is_important = false,
      labels = [],
      reply_to_mail_id,
      thread_id
    } = await request.json()

    if (!is_draft && (!recipient_id || !subject || !content)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify recipient exists only if not a draft
    let recipient = null
    if (!is_draft && recipient_id) {
      const { data: recipientData, error: recipientError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', recipient_id)
        .single()

      if (recipientError || !recipientData) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }
      recipient = recipientData
    }

    // Create the mail
    const mailData: any = {
      sender_id: user.id,
      subject,
      content,
      mail_type,
      related_id,
      related_type,
      is_draft,
      is_starred,
      is_important,
      labels,
      thread_id: thread_id || (reply_to_mail_id ? undefined : undefined) // Generate new thread_id if not provided
    }

    if (!is_draft && recipient_id) {
      mailData.recipient_id = recipient_id
    }

    if (reply_to_mail_id) {
      mailData.reply_to_mail_id = reply_to_mail_id
      // Get thread_id from the mail being replied to
      const { data: replyToMail } = await supabaseAdmin
        .from('mails')
        .select('thread_id')
        .eq('id', reply_to_mail_id)
        .single()
      
      if (replyToMail?.thread_id) {
        mailData.thread_id = replyToMail.thread_id
      }
    }

    const { data: mail, error: insertError } = await supabase
      .from('mails')
      .insert(mailData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating mail:', insertError)
      return NextResponse.json({ error: 'Failed to send mail', details: insertError.message, code: insertError.code }, { status: 500 })
    }

    // Send webhook notification for new mail (only if not a draft)
    if (!is_draft && recipient) {
      try {
        await sendNewWebhook({
          action: 'new_mail',
          timestamp: new Date().toISOString(),
          mail_id: mail.id,
          mail_subject: mail.subject,
          sender_id: user.id,
          sender_email: user.email,
          sender_name: user.user_metadata?.full_name || user.email,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name || recipient.email,
        })
      } catch (webhookError) {
        console.error('Webhook error for new mail:', webhookError)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ mail, message: 'Mail sent successfully' })
  } catch (error) {
    console.error('Unexpected error in mails POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
