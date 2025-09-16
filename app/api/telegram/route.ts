import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// POST - Send message to Telegram or handle incoming webhook
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') // 'send' or 'webhook'
    
    if (action === 'send') {
      return await handleSendMessage(request)
    } else if (action === 'webhook') {
      return await handleIncomingWebhook(request)
    } else {
      return NextResponse.json({ error: 'Invalid action. Use ?action=send or ?action=webhook' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error in telegram API:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// Send message to Telegram
async function handleSendMessage(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { 
      chat_id, 
      message, 
      recipient_id, 
      subject, 
      content,
      reply_to_message_id 
    } = await request.json()

    // Get Telegram bot token from system settings
    const { data: botTokenSetting, error: tokenError } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'telegram_bot_token')
      .single()

    if (tokenError || !botTokenSetting?.setting_value) {
      return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 })
    }

    const botToken = botTokenSetting.setting_value

    // If this is a mail being sent through Telegram
    if (recipient_id && subject && content) {
      // Create mail record
      const { data: mail, error: mailError } = await supabase
        .from('mails')
        .insert({
          sender_id: user.id,
          recipient_id,
          subject,
          content,
          mail_type: 'telegram_message'
        })
        .select('*')
        .single()

      if (mailError) {
        console.error('Error creating mail:', mailError)
        return NextResponse.json({ error: 'Failed to create mail', details: mailError.message }, { status: 500 })
      }

      // Format message for Telegram
      const telegramMessage = `📧 *New Mail*\n\n*From:* ${user.user_metadata?.full_name || user.email}\n*Subject:* ${subject}\n\n${content}`
      
      // Send to Telegram
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id,
          text: telegramMessage,
          parse_mode: 'Markdown',
          reply_to_message_id
        })
      })

      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json()
        console.error('Telegram API error:', errorData)
        return NextResponse.json({ error: 'Failed to send to Telegram', details: errorData.description }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        mail_id: mail.id,
        message: 'Mail sent successfully via Telegram' 
      })
    }

    // Regular message sending
    if (!chat_id || !message) {
      return NextResponse.json({ error: 'chat_id and message are required' }, { status: 400 })
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        reply_to_message_id
      })
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error('Telegram API error:', errorData)
      return NextResponse.json({ error: 'Failed to send to Telegram', details: errorData.description }, { status: 500 })
    }

    const result = await telegramResponse.json()
    return NextResponse.json({ success: true, message_id: result.result.message_id })

  } catch (error) {
    console.error('Error in handleSendMessage:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// Handle incoming webhook from Telegram
async function handleIncomingWebhook(request: NextRequest) {
  try {
    const update = await request.json()
    
    // Verify webhook token if configured
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    
    if (token) {
      const { data: webhookTokenSetting } = await supabaseAdmin
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'telegram_webhook_token')
        .single()
      
      if (webhookTokenSetting?.setting_value !== token) {
        return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 })
      }
    }

    // Process the update
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text
      const fromUser = message.from

      // Handle commands
      if (text?.startsWith('/')) {
        return await handleTelegramCommand(chatId, text, fromUser)
      }

      // Handle regular messages (could be mail replies)
      if (text) {
        return await handleTelegramMessage(chatId, text, fromUser, message.message_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in handleIncomingWebhook:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

async function handleTelegramCommand(chatId: number, command: string, fromUser: any) {
  // Handle /start, /help, /status commands
  const responses: { [key: string]: string } = {
    '/start': 'Welcome to Verxyl Ticket System Telegram Bot!\n\nCommands:\n/help - Show help\n/status - Check system status\n/reply <mail_id> <message> - Reply to a mail',
    '/help': 'Available commands:\n/start - Start the bot\n/status - Check system status\n/reply <mail_id> <message> - Reply to a mail',
    '/status': '✅ Verxyl Ticket System is online and running!'
  }

  const response = responses[command] || 'Unknown command. Use /help for available commands.'
  
  // Send response back to Telegram
  const { data: botTokenSetting } = await supabaseAdmin
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'telegram_bot_token')
    .single()

  if (botTokenSetting?.setting_value) {
    await fetch(`https://api.telegram.org/bot${botTokenSetting.setting_value}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: response
      })
    })
  }

  return NextResponse.json({ success: true, command, response })
}

async function handleTelegramMessage(chatId: number, text: string, fromUser: any, messageId: number) {
  // This could handle mail replies or other message processing
  // For now, just acknowledge receipt
  
  const { data: botTokenSetting } = await supabaseAdmin
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'telegram_bot_token')
    .single()

  if (botTokenSetting?.setting_value) {
    await fetch(`https://api.telegram.org/bot${botTokenSetting.setting_value}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Message received: "${text}"`,
        reply_to_message_id: messageId
      })
    })
  }

  return NextResponse.json({ success: true, message: 'Message processed' })
}
