import { NextResponse, NextRequest } from 'next/server'
import { getUserNotificationSettings } from '@/lib/new-webhook'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
    }

    console.log('Testing notification settings for user:', userId)
    
    const notificationSettings = await getUserNotificationSettings(userId)
    
    console.log('Retrieved notification settings:', notificationSettings)

    return NextResponse.json({ 
      userId,
      notificationSettings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in debug notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
