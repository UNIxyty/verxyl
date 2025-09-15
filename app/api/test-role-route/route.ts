import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Role route test endpoint is working',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ 
    message: 'PATCH method is working',
    body: body,
    timestamp: new Date().toISOString()
  })
}
