import { supabase, supabaseAdmin } from './supabase'

/**
 * Upload an invoice PDF to Supabase Storage
 * @param file - The PDF file to upload
 * @param invoiceId - The invoice ID to use in the filename
 * @returns Promise with the public URL or error
 */
export async function uploadInvoicePDF(file: File, invoiceId: string) {
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed')
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB')
    }

    const fileName = `invoice-${invoiceId}.pdf`
    
    // Upload file to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('invoices')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      })

    if (error) {
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('invoices')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Error uploading invoice PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete an invoice PDF from Supabase Storage
 * @param invoiceId - The invoice ID
 * @returns Promise with success status
 */
export async function deleteInvoicePDF(invoiceId: string) {
  try {
    const fileName = `invoice-${invoiceId}.pdf`
    
    const { error } = await supabaseAdmin.storage
      .from('invoices')
      .remove([fileName])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting invoice PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Get the public URL for an invoice PDF
 * @param invoiceId - The invoice ID
 * @returns The public URL for the PDF
 */
export function getInvoicePDFUrl(invoiceId: string): string {
  const fileName = `invoice-${invoiceId}.pdf`
  const { data } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName)
  
  return data.publicUrl
}

/**
 * Check if an invoice PDF exists in storage
 * @param invoiceId - The invoice ID
 * @returns Promise with existence status
 */
export async function checkInvoicePDFExists(invoiceId: string) {
  try {
    const fileName = `invoice-${invoiceId}.pdf`
    
    const { data, error } = await supabase.storage
      .from('invoices')
      .list('', {
        limit: 1,
        search: fileName
      })

    if (error) {
      throw error
    }

    return {
      exists: data && data.length > 0,
      file: data?.[0] || null
    }
  } catch (error) {
    console.error('Error checking invoice PDF:', error)
    return {
      exists: false,
      file: null,
      error: error instanceof Error ? error.message : 'Check failed'
    }
  }
}
