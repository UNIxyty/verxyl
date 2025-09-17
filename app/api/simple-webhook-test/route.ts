import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Simple webhook test endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({
    message: 'POST endpoint working',
    received: body,
    timestamp: new Date().toISOString()
  })
}
