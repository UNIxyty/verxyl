import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const webhookUrl = process.env.WEBHOOK_URL
    
    return NextResponse.json({
      webhookUrl: webhookUrl ? '[SET]' : '[NOT SET]',
      webhookUrlLength: webhookUrl?.length || 0,
      allEnvVars: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasWebhookUrl: !!process.env.WEBHOOK_URL
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
