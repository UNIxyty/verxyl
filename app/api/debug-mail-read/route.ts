import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { mailId } = await request.json()
    
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
      return NextResponse.json({ 
        error: 'Authentication failed', 
        authError: authError?.message,
        user: !!user 
      }, { status: 401 })
    }

    // Check if mail exists
    const { data: mail, error: mailError } = await supabase
      .from('mails')
      .select('*')
      .eq('id', mailId)
      .single()

    if (mailError) {
      return NextResponse.json({ 
        error: 'Mail fetch failed', 
        mailError: mailError.message,
        mailId 
      }, { status: 500 })
    }

    if (!mail) {
      return NextResponse.json({ 
        error: 'Mail not found',
        mailId 
      }, { status: 404 })
    }

    // Check if user is recipient
    const isRecipient = mail.recipient_id === user.id
    const isSender = mail.sender_id === user.id

    // Try to update
    const { data: updatedMail, error: updateError } = await supabase
      .from('mails')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', mailId)
      .eq('recipient_id', user.id)
      .select('*')
      .single()

    return NextResponse.json({
      success: true,
      debug: {
        mailId,
        userId: user.id,
        mailRecipientId: mail.recipient_id,
        mailSenderId: mail.sender_id,
        isRecipient,
        isSender,
        originalMail: mail,
        updatedMail,
        updateError: updateError?.message
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
