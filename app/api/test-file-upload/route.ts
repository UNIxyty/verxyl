import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    console.log('=== File Upload Test Debug ===')
    console.log('FormData entries:')
    
    // Convert FormData to array for iteration
    const entries = Array.from(formData.entries())
    for (const [key, value] of entries) {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type
        })
      } else {
        console.log(`${key}:`, value)
      }
    }
    
    const file = formData.get('file') as File
    const mailId = formData.get('mailId') as string
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        debug: 'File field is missing or empty'
      }, { status: 400 })
    }
    
    if (!mailId) {
      return NextResponse.json({ 
        error: 'No mailId provided',
        debug: 'mailId field is missing or empty'
      }, { status: 400 })
    }
    
    // File validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    const validation = {
      fileExists: !!file,
      mailIdExists: !!mailId,
      fileSize: file.size,
      fileSizeValid: file.size <= maxSize,
      fileType: file.type,
      fileTypeValid: allowedTypes.includes(file.type),
      fileName: file.name
    }
    
    console.log('Validation results:', validation)
    
    if (!validation.fileSizeValid) {
      return NextResponse.json({ 
        error: 'File too large',
        maxSize: maxSize,
        actualSize: file.size,
        validation
      }, { status: 400 })
    }
    
    if (!validation.fileTypeValid) {
      return NextResponse.json({ 
        error: 'File type not allowed',
        allowedTypes,
        actualType: file.type,
        validation
      }, { status: 400 })
    }
    
    // Simulate successful validation
    return NextResponse.json({
      success: true,
      message: 'File upload validation passed - ready for actual upload',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      mailId: mailId,
      validation,
      nextStep: 'Use /api/mails/attachments for actual upload'
    })
    
  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
