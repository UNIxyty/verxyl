import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Environment test',
    webhookUrl: process.env.WEBHOOK_URL ? 'SET' : 'NOT SET',
    timestamp: new Date().toISOString()
  })
}
