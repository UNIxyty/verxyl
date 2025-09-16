import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simple Debug Test ===')
    
    // Test 1: Environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
    console.log('Environment check:', envCheck)
    
    if (!envCheck.hasUrl || !envCheck.hasKey || !envCheck.hasServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        envCheck
      }, { status: 500 })
    }

    // Test 2: Authentication
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
    console.log('Auth test:', { userExists: !!user, userId: user?.id, authError: authError?.message })

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        authError: authError?.message,
        userExists: !!user
      }, { status: 401 })
    }

    // Test 3: Parse form data
    let formData
    let file
    let mailId
    try {
      formData = await request.formData()
      file = formData.get('file') as File
      mailId = formData.get('mailId') as string
      console.log('Form data parsed:', { fileExists: !!file, fileName: file?.name, mailIdExists: !!mailId })
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to parse form data',
        details: (error as Error).message
      }, { status: 400 })
    }

    if (!file || !mailId) {
      return NextResponse.json({ 
        error: 'Missing file or mailId',
        fileExists: !!file,
        mailIdExists: !!mailId
      }, { status: 400 })
    }

    // Test 4: Mail lookup
    let mail
    try {
      const { data: mailData, error: mailError } = await supabaseAdmin
        .from('mails')
        .select('id, sender_id, recipient_id')
        .eq('id', mailId)
        .single()
      
      console.log('Mail lookup:', { mailExists: !!mailData, mailError: mailError?.message })
      
      if (mailError || !mailData) {
        return NextResponse.json({ 
          error: 'Mail not found',
          mailError: mailError?.message,
          mailExists: !!mailData
        }, { status: 404 })
      }
      
      mail = mailData
    } catch (error) {
      return NextResponse.json({ 
        error: 'Mail lookup failed',
        details: (error as Error).message
      }, { status: 500 })
    }

    // Test 5: Permission check
    const hasPermission = mail.sender_id === user.id || mail.recipient_id === user.id
    console.log('Permission check:', { 
      userId: user.id, 
      senderId: mail.sender_id, 
      recipientId: mail.recipient_id, 
      hasPermission 
    })

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'No permission to attach files to this mail',
        userId: user.id,
        senderId: mail.sender_id,
        recipientId: mail.recipient_id
      }, { status: 403 })
    }

    // Test 6: Storage bucket check
    let bucketExists = false
    try {
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
      console.log('Storage buckets:', { bucketsCount: buckets?.length, bucketError: bucketError?.message })
      
      if (bucketError) {
        return NextResponse.json({ 
          error: 'Storage service error',
          bucketError: bucketError.message
        }, { status: 500 })
      }
      
      bucketExists = buckets?.some(bucket => bucket.id === 'mail-attachments') || false
      console.log('Bucket exists:', bucketExists)
      
      if (!bucketExists) {
        return NextResponse.json({ 
          error: 'mail-attachments bucket does not exist',
          availableBuckets: buckets?.map(b => b.id)
        }, { status: 500 })
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Storage check failed',
        details: (error as Error).message
      }, { status: 500 })
    }

    // Test 7: Database table check
    try {
      const { data: tableTest, error: tableError } = await supabaseAdmin
        .from('mail_attachments')
        .select('id')
        .limit(1)
      
      console.log('Table test:', { tableExists: !tableError, tableError: tableError?.message })
      
      if (tableError) {
        return NextResponse.json({ 
          error: 'mail_attachments table does not exist',
          tableError: tableError.message
        }, { status: 500 })
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Table check failed',
        details: (error as Error).message
      }, { status: 500 })
    }

    // All tests passed
    return NextResponse.json({
      success: true,
      message: 'All checks passed - ready for file upload',
      tests: {
        environment: envCheck,
        authentication: { userExists: !!user, userId: user.id },
        formData: { fileExists: !!file, fileName: file?.name, mailIdExists: !!mailId },
        mail: { mailExists: !!mail, senderId: mail.sender_id, recipientId: mail.recipient_id },
        permission: { hasPermission },
        storage: { bucketExists },
        database: { tableExists: true }
      }
    })

  } catch (error) {
    console.error('Simple debug error:', error)
    return NextResponse.json({ 
      error: 'Debug test failed', 
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 })
  }
}
