import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Debug Attachment Upload ===')
    
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log('Environment check:', { hasUrl, hasKey })
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        debug: { hasUrl, hasKey }
      }, { status: 500 })
    }

    // Test authentication
    const cookieStore = cookies()
    console.log('Cookie store created')
    
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
    console.log('Supabase client created')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { 
      userExists: !!user, 
      userId: user?.id,
      authError: authError?.message 
    })

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        debug: { authError: authError?.message, userExists: !!user }
      }, { status: 401 })
    }

    // Parse form data
    console.log('Parsing form data...')
    const formData = await request.formData()
    console.log('Form data parsed successfully')
    
    const file = formData.get('file') as File
    const mailId = formData.get('mailId') as string
    
    console.log('Form data extraction:', {
      fileExists: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      mailIdExists: !!mailId,
      mailId: mailId
    })

    if (!file || !mailId) {
      return NextResponse.json({ 
        error: 'File and mailId are required',
        debug: { fileExists: !!file, mailIdExists: !!mailId }
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    console.log('File size validation:', {
      fileSize: file.size,
      maxSize: maxSize,
      isValid: file.size <= maxSize
    })
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 10MB limit',
        debug: { fileSize: file.size, maxSize }
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    console.log('File type validation:', {
      fileType: file.type,
      allowedTypes,
      isValid: allowedTypes.includes(file.type)
    })

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed',
        debug: { fileType: file.type, allowedTypes }
      }, { status: 400 })
    }

    // Test mail lookup with admin client
    console.log('Looking up mail with admin client...')
    const { data: mail, error: mailError } = await supabaseAdmin
      .from('mails')
      .select('sender_id, recipient_id')
      .eq('id', mailId)
      .single()
    
    console.log('Mail lookup result:', {
      mailExists: !!mail,
      mailSenderId: mail?.sender_id,
      mailRecipientId: mail?.recipient_id,
      mailError: mailError?.message
    })

    if (mailError || !mail) {
      return NextResponse.json({ 
        error: 'Mail not found',
        debug: { mailError: mailError?.message, mailExists: !!mail }
      }, { status: 404 })
    }

    // Check permissions
    const isSender = mail.sender_id === user.id
    const isRecipient = mail.recipient_id === user.id
    const hasPermission = isSender || isRecipient
    
    console.log('Permission check:', {
      userId: user.id,
      senderId: mail.sender_id,
      recipientId: mail.recipient_id,
      isSender,
      isRecipient,
      hasPermission
    })

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: { 
          userId: user.id,
          senderId: mail.sender_id,
          recipientId: mail.recipient_id
        }
      }, { status: 403 })
    }

    // Test storage bucket access
    console.log('Testing storage bucket access...')
    try {
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
      console.log('Storage buckets:', { 
        bucketsCount: buckets?.length,
        bucketError: bucketError?.message,
        bucketNames: buckets?.map(b => b.name)
      })
    } catch (error) {
      console.log('Storage test error:', error)
    }

    // Return success without actually uploading
    return NextResponse.json({
      success: true,
      message: 'Debug validation passed - ready for actual upload',
      debug: {
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        mail: {
          id: mailId,
          senderId: mail.sender_id,
          recipientId: mail.recipient_id
        },
        user: {
          id: user.id
        },
        permissions: {
          isSender,
          isRecipient,
          hasPermission
        }
      }
    })

  } catch (error) {
    console.error('Debug upload error:', error)
    return NextResponse.json({ 
      error: 'Debug test failed', 
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 })
  }
}
