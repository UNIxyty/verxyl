import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - Fetch invoices (supports both admin and public access)
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const url = new URL(request.url)
    const invoice_id = url.searchParams.get('id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // For public access (individual invoice viewing), we don't require authentication
    // For admin operations, we check authentication
    let supabase
    const cookieStore = cookies()
    
    try {
      supabase = createServerClient(
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
    } catch {
      // Fallback to admin client if cookie-based auth fails
      supabase = supabaseAdmin
    }

    // If requesting a specific invoice by ID, allow public access
    if (invoice_id) {
      const { data: invoice, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }
        console.error('Error fetching invoice:', error)
        return NextResponse.json({ error: 'Failed to fetch invoice', details: error.message }, { status: 500 })
      }

      return NextResponse.json({ invoice })
    }

    // For listing invoices, require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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

// POST - Create a new invoice (admin only)
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const {
      client_name,
      client_company,
      project_description,
      project_points_problems,
      invoice_pdf,
      payment_link
    } = await request.json()

    if (!client_name || client_name.trim().length === 0) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    if (!project_description || project_description.trim().length === 0) {
      return NextResponse.json({ error: 'Project description is required' }, { status: 400 })
    }

    if (!project_points_problems || project_points_problems.trim().length === 0) {
      return NextResponse.json({ error: 'Project points and problems are required' }, { status: 400 })
    }

    if (!payment_link || payment_link.trim().length === 0) {
      return NextResponse.json({ error: 'Payment link is required' }, { status: 400 })
    }

    const { data: invoice, error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert({
        client_name: client_name.trim(),
        client_company: client_company?.trim() || null,
        project_description: project_description.trim(),
        project_points_problems: project_points_problems.trim(),
        invoice_pdf: invoice_pdf || null,
        payment_link: payment_link.trim()
      })
      .select('*')
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
