import { NextRequest, NextResponse } from 'next/server'
import { sendTicketWebhook } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING ALL WEBHOOK ACTIONS ===')

    const testTicketId = 'test-ticket-' + Date.now()
    
    const webhookActions = [
      { action: 'created', description: 'Ticket Created' },
      { action: 'updated', description: 'Ticket Updated' },
      { action: 'in_work', description: 'Ticket In Work' },
      { action: 'solved', description: 'Ticket Solved' },
      { action: 'deleted', description: 'Ticket Deleted' }
    ]

    const results = []

    for (const { action, description } of webhookActions) {
      console.log(`Testing ${description} webhook...`)
      try {
        const result = await sendTicketWebhook(testTicketId, action)
        results.push({
          action,
          description,
          success: result,
          timestamp: new Date().toISOString()
        })
        console.log(`${description} webhook result:`, result)
      } catch (error) {
        console.error(`${description} webhook error:`, error)
        results.push({
          action,
          description,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      message: `Tested ${totalCount} webhook actions`,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      results,
      webhookUrl: 'https://n8n.fluntstudios.com/webhook/tickets'
    })

  } catch (error) {
    console.error('Test all webhooks error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
