import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG MAIL POST ===')
    
    // Check environment variables
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      }, { status: 500 })
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

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // Test request body parsing
    let requestBody
    try {
      requestBody = await request.json()
      console.log('Request body:', requestBody)
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid JSON',
        details: (parseError as Error).message
      }, { status: 400 })
    }

    const { recipient_id, subject, content, mail_type = 'message', related_id, related_type } = requestBody

    if (!recipient_id || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: `Missing: ${!recipient_id ? 'recipient_id ' : ''}${!subject ? 'subject ' : ''}${!content ? 'content' : ''}`
      }, { status: 400 })
    }

    // Test recipient lookup with admin client
    console.log('Looking up recipient:', recipient_id)
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', recipient_id)
      .single()

    console.log('Recipient lookup result:', { recipient: recipient?.email, error: recipientError?.message })

    if (recipientError || !recipient) {
      return NextResponse.json({ 
        error: 'Recipient not found',
        details: recipientError?.message || 'Recipient not found'
      }, { status: 404 })
    }

    // Test mail table access
    console.log('Testing mail table access...')
    const { data: testMail, error: testError } = await supabase
      .from('mails')
      .select('*')
      .limit(1)

    console.log('Mail table test:', { count: testMail?.length, error: testError?.message })

    if (testError) {
      return NextResponse.json({ 
        error: 'Mail table access failed',
        details: testError.message
      }, { status: 500 })
    }

    // Test mail insertion
    console.log('Testing mail insertion...')
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

    console.log('Mail insertion result:', { mail: mail?.id, error: insertError?.message })

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to insert mail',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      mail,
      debug: {
        user_id: user.id,
        recipient_id,
        mail_table_accessible: true,
        insertion_successful: true
      }
    })

  } catch (error) {
    console.error('Unexpected error in debug mail POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 })
  }
}
