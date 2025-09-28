import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { invoice_id, pdf_data, client_name } = await request.json()

    // Validate required fields
    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' }, 
        { status: 400 }
      )
    }

    if (!pdf_data) {
      return NextResponse.json(
        { error: 'pdf_data (base64 encoded) is required' }, 
        { status: 400 }
      )
    }

    // Validate that invoice exists
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id, client_name')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' }, 
        { status: 404 }
      )
    }

    // Convert base64 to buffer
    let buffer: Buffer
    try {
      // Remove data URL prefix if present (data:application/pdf;base64,)
      const base64Data = pdf_data.replace(/^data:application\/pdf;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid base64 PDF data' }, 
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF file too large. Maximum size is 10MB' }, 
        { status: 400 }
      )
    }

    const fileName = `invoice-${invoice_id}.pdf`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload PDF to storage', details: uploadError.message }, 
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('invoices')
      .getPublicUrl(fileName)

    // Update invoice record with PDF URL
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        invoice_pdf: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'PDF uploaded but failed to update invoice record', details: updateError.message }, 
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      invoice_id,
      client_name: invoice.client_name,
      pdf_url: urlData.publicUrl,
      file_path: uploadData.path,
      file_size: buffer.length,
      message: 'PDF uploaded successfully and invoice updated'
    })

  } catch (error) {
    console.error('N8N PDF upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}

// GET method for testing/health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/n8n/upload-invoice-pdf',
    method: 'POST',
    description: 'Upload PDF files to Supabase Storage for invoices',
    required_fields: {
      invoice_id: 'UUID of the invoice',
      pdf_data: 'Base64 encoded PDF data (with or without data URL prefix)'
    },
    optional_fields: {
      client_name: 'Client name for logging purposes'
    },
    example_request: {
      invoice_id: 'uuid-here',
      pdf_data: 'JVBERi0xLjQKJdPr6eEK...',
      client_name: 'John Doe'
    }
  })
}
