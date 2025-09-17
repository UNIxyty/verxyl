import { NextRequest, NextResponse } from 'next/server'
import { sendUserWebhook } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING USERS WEBHOOK ACTIONS ===')

    const testUserId = 'test-user-' + Date.now()
    
    const webhookActions = [
      { 
        action: 'role_changed', 
        description: 'User Role Changed',
        additionalData: {
          old_role: 'viewer',
          new_role: 'worker',
          changed_by: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            name: 'Admin User'
          },
          changed_at: new Date().toISOString()
        }
      },
      { 
        action: 'user_approved', 
        description: 'User Approved',
        additionalData: {
          approved_by: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            name: 'Admin User'
          },
          approved_at: new Date().toISOString()
        }
      },
      { 
        action: 'user_rejected', 
        description: 'User Rejected',
        additionalData: {
          rejected_by: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            name: 'Admin User'
          },
          rejection_reason: 'Invalid information provided',
          rejected_at: new Date().toISOString()
        }
      }
    ]

    const results = []

    for (const { action, description, additionalData } of webhookActions) {
      console.log(`Testing ${description} webhook...`)
      try {
        const result = await sendUserWebhook(testUserId, action, additionalData)
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
      message: `Tested ${totalCount} users webhook actions`,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      results,
      webhookUrl: 'https://n8n.fluntstudios.com/webhook/users'
    })

  } catch (error) {
    console.error('Test users webhooks error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
