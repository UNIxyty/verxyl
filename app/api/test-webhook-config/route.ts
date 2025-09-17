import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing webhook configuration...')
    
    // Get webhook domain
    const { data: domainData, error: domainError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_domain')
      .single()

    // Get webhook path for tickets
    const { data: pathData, error: pathError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'webhook_path_tickets')
      .single()

    console.log('Domain data:', domainData)
    console.log('Path data:', pathData)
    console.log('Domain error:', domainError)
    console.log('Path error:', pathError)

    const webhookDomain = domainData?.setting_value
    const webhookPath = pathData?.setting_value

    const response = {
      webhookDomain,
      webhookPath,
      constructedUrl: webhookDomain && webhookPath ? `${webhookDomain}${webhookPath}` : null,
      errors: {
        domainError: domainError?.message,
        pathError: pathError?.message
      },
      timestamp: new Date().toISOString()
    }

    console.log('Webhook config response:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in test webhook config:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
