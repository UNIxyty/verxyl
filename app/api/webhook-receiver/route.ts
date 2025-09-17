import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    console.log('Body:', JSON.stringify(body, null, 2))
    console.log('Timestamp:', new Date().toISOString())
    console.log('=== END WEBHOOK ===')

    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: body
    })

  } catch (error) {
    console.error('Webhook receiver error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook receiver is running',
    timestamp: new Date().toISOString(),
    methods: ['POST']
  })
}
