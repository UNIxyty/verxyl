import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

    // Validate update data
    const allowedFields = ['is_read', 'is_starred', 'is_important', 'is_spam', 'is_trash', 'labels']
    const updateFields: any = {}

    // Process each field
    if ('is_read' in updateData) {
      updateFields.is_read = Boolean(updateData.is_read)
      if (updateFields.is_read) {
        updateFields.read_at = new Date().toISOString()
      } else {
        updateFields.read_at = null
      }
    }

    if ('is_starred' in updateData) {
      updateFields.is_starred = Boolean(updateData.is_starred)
    }

    if ('is_important' in updateData) {
      updateFields.is_important = Boolean(updateData.is_important)
    }

    if ('is_spam' in updateData) {
      updateFields.is_spam = Boolean(updateData.is_spam)
    }

    if ('is_trash' in updateData) {
      updateFields.is_trash = Boolean(updateData.is_trash)
    }

    if ('labels' in updateData && Array.isArray(updateData.labels)) {
      updateFields.labels = updateData.labels
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Get the current mail to check permissions
    const { data: currentMail, error: fetchError } = await supabase
      .from('mails')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentMail) {
      return NextResponse.json({ error: 'Mail not found' }, { status: 404 })
    }

    // Check permissions based on the field being updated
    let whereClause: any = { id }

    if ('is_read' in updateData) {
      // Only recipient can mark as read/unread
      whereClause.recipient_id = user.id
    } else {
      // For other fields, both sender and recipient can update
      whereClause = {
        id,
        or: `recipient_id.eq.${user.id},sender_id.eq.${user.id}`
      }
    }

    // Update the mail
    const { data: mail, error } = await supabase
      .from('mails')
      .update(updateFields)
      .match(whereClause)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating mail:', error)
      return NextResponse.json({ 
        error: 'Failed to update mail', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    if (!mail) {
      return NextResponse.json({ error: 'Mail not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      mail, 
      message: 'Mail updated successfully',
      updatedFields: Object.keys(updateFields)
    })

  } catch (error) {
    console.error('Unexpected error in mail update PATCH:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}