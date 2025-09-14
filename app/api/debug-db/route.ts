import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== DATABASE DEBUG START ===')
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured',
        configured: false
      })
    }
    
    const results: any = {
      configured: true,
      timestamp: new Date().toISOString()
    }
    
    // Test 1: Check if users table exists and get sample data
    console.log('Testing users table...')
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(3)
      
      if (usersError) {
        results.usersError = {
          message: usersError.message,
          code: usersError.code,
          details: usersError.details
        }
      } else {
        results.users = {
          count: users?.length || 0,
          sample: users || [],
          structure: users?.[0] ? Object.keys(users[0]) : []
        }
      }
    } catch (error) {
      results.usersError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Test 2: Check if tickets table exists
    console.log('Testing tickets table...')
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .limit(1)
      
      if (ticketsError) {
        results.ticketsError = {
          message: ticketsError.message,
          code: ticketsError.code,
          details: ticketsError.details
        }
      } else {
        results.tickets = {
          count: tickets?.length || 0,
          structure: tickets?.[0] ? Object.keys(tickets[0]) : []
        }
      }
    } catch (error) {
      results.ticketsError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Test 3: Check database schema
    console.log('Testing schema...')
    try {
      const { data: schema, error: schemaError } = await supabase
        .rpc('get_schema_info')
        .single()
      
      if (schemaError) {
        results.schemaError = schemaError.message
      } else {
        results.schema = schema
      }
    } catch (error) {
      results.schemaError = error instanceof Error ? error.message : 'Schema check failed'
    }
    
    console.log('=== DATABASE DEBUG COMPLETE ===')
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('=== DATABASE DEBUG ERROR ===', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
  }
}
