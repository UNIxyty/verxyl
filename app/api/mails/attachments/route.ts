import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// POST - Upload file attachment
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mailId = formData.get('mailId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!mailId) {
      return NextResponse.json({ error: 'Mail ID is required' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `mail-attachments/${user.id}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mail-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create attachment record in database
    const { data: attachment, error: dbError } = await supabase
      .from('mail_attachments')
      .insert({
        mail_id: mailId,
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })
      .select('*')
      .single()

    if (dbError) {
      console.error('Error creating attachment record:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('mail-attachments').remove([filePath])
      return NextResponse.json({ error: 'Failed to save attachment record' }, { status: 500 })
    }

    return NextResponse.json({ 
      attachment, 
      message: 'File uploaded successfully',
      downloadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mail-attachments/${filePath}`
    })

  } catch (error) {
    console.error('Unexpected error in attachment upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}

// GET - Get attachments for a mail
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

    const { searchParams } = new URL(request.url)
    const mailId = searchParams.get('mailId')

    if (!mailId) {
      return NextResponse.json({ error: 'Mail ID is required' }, { status: 400 })
    }

    const { data: attachments, error } = await supabase
      .from('mail_attachments')
      .select('*')
      .eq('mail_id', mailId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    // Generate download URLs for each attachment
    const attachmentsWithUrls = attachments?.map(attachment => ({
      ...attachment,
      downloadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mail-attachments/${attachment.file_path}`
    })) || []

    return NextResponse.json({ attachments: attachmentsWithUrls })

  } catch (error) {
    console.error('Unexpected error in attachments GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
