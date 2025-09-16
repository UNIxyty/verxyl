import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check storage buckets
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketError.message 
      }, { status: 500 })
    }

    const mailAttachmentsBucket = buckets?.find(bucket => bucket.id === 'mail-attachments')
    
    // Check if mail_attachments table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('mail_attachments')
      .select('id')
      .limit(1)

    return NextResponse.json({
      success: true,
      storage: {
        buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
        mailAttachmentsBucket: mailAttachmentsBucket ? {
          id: mailAttachmentsBucket.id,
          name: mailAttachmentsBucket.name,
          public: mailAttachmentsBucket.public,
          exists: true
        } : { exists: false }
      },
      database: {
        mailAttachmentsTable: {
          exists: !tableError,
          error: tableError?.message
        }
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Check failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
