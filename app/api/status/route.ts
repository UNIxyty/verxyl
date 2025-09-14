import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== STATUS CHECK START ===')
    
    const status = {
      timestamp: new Date().toISOString(),
      supabase: {
        configured: isSupabaseConfigured(),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      tests: {}
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ...status,
        error: 'Supabase not configured'
      })
    }
    
    // Test 1: Check if users table is accessible
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      status.tests.users = {
        accessible: !usersError,
        error: usersError?.message || null
      }
    } catch (error) {
      status.tests.users = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test 2: Check if tickets table is accessible for reading
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('count')
        .limit(1)
      
      status.tests.ticketsRead = {
        accessible: !ticketsError,
        error: ticketsError?.message || null
      }
    } catch (error) {
      status.tests.ticketsRead = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test 3: Check if tickets table is accessible for writing (this will fail if RLS is blocking)
    try {
      const testData = {
        title: 'RLS Test ' + Date.now(),
        urgency: 'low' as const,
        details: 'Testing RLS status',
        assigned_to: 'dd02c4ba-58db-4223-a9c7-abf7975bb249',
        created_by: 'fbbc5913-1540-42ef-b333-65e1654160b8',
        status: 'new' as const
      }
      
      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert(testData)
        .select()
        .single()
      
      if (insertError) {
        status.tests.ticketsWrite = {
          accessible: false,
          error: insertError.message,
          code: insertError.code,
          isRLSError: insertError.message.includes('row-level security')
        }
      } else {
        status.tests.ticketsWrite = {
          accessible: true,
          error: null,
          testId: data.id
        }
        
        // Clean up test record
        await supabase
          .from('tickets')
          .delete()
          .eq('id', data.id)
      }
    } catch (error) {
      status.tests.ticketsWrite = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isRLSError: error instanceof Error && error.message.includes('row-level security')
      }
    }
    
    console.log('=== STATUS CHECK COMPLETE ===')
    return NextResponse.json(status)
    
  } catch (error) {
    console.error('=== STATUS CHECK ERROR ===', error)
    return NextResponse.json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
