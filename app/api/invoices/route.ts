import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch invoices
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const client_id = url.searchParams.get('client_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('invoices')
      .select(`
        *,
        created_by_user:users!invoices_created_by_fkey(id, email, full_name, role),
        client:users!invoices_client_id_fkey(id, email, full_name, role),
        project:projects!invoices_project_id_fkey(id, title, status)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Unexpected error in invoices GET:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
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
      title,
      description,
      amount,
      currency = 'USD',
      client_id,
      project_id,
      due_date
    } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Invoice title is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabaseAdmin
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let invoiceNumber = 'INV-001'
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1])
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`
    }

    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        title: title.trim(),
        description,
        amount,
        currency,
        client_id,
        project_id,
        due_date,
        created_by: user.id
      })
      .select(`
        *,
        created_by_user:users!invoices_created_by_fkey(id, email, full_name, role),
        client:users!invoices_client_id_fkey(id, email, full_name, role),
        project:projects!invoices_project_id_fkey(id, title, status)
      `)
      .single()

    if (insertError) {
      console.error('Error creating invoice:', insertError)
      return NextResponse.json({ error: 'Failed to create invoice', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ invoice, message: 'Invoice created successfully' })
  } catch (error) {
    console.error('Unexpected error in invoices POST:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 })
  }
}
