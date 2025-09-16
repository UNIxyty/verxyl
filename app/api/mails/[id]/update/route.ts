import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// PATCH - Update mail properties (star, important, labels, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const updateData = await request.json()

    // Validate that the user can update this mail
    const { data: existingMail, error: fetchError } = await supabaseAdmin
      .from('mails')
      .select('id, sender_id, recipient_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingMail) {
      return NextResponse.json({ error: 'Mail not found' }, { status: 404 })
    }

    // Check if user is sender or recipient
    if (existingMail.sender_id !== user.id && existingMail.recipient_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the mail
    const { data: updatedMail, error: updateError } = await supabase
      .from('mails')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating mail:', updateError)
      return NextResponse.json({ error: 'Failed to update mail', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ mail: updatedMail, message: 'Mail updated successfully' })
  } catch (error) {
    console.error('Unexpected error in mail update PATCH:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
