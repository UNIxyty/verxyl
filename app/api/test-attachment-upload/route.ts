import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // This is a test endpoint to help debug file uploads
    const formData = await request.formData()
    
    console.log('=== Test Attachment Upload Debug ===')
    console.log('FormData keys:', Array.from(formData.keys()))
    
    const file = formData.get('file') as File
    const mailId = formData.get('mailId') as string
    
    console.log('File:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file')
    
    console.log('MailId:', mailId)
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!mailId) {
      return NextResponse.json({ error: 'No mailId provided' }, { status: 400 })
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large', 
        maxSize: maxSize,
        actualSize: file.size 
      }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed', 
        allowedTypes,
        actualType: file.type 
      }, { status: 400 })
    }
    
    // Simulate successful upload
    return NextResponse.json({
      success: true,
      message: 'Test upload validation passed',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      mailId: mailId,
      debug: {
        formDataKeys: Array.from(formData.keys()),
        fileExists: !!file,
        mailIdExists: !!mailId
      }
    })
    
  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
