'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  CreditCardIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Invoice {
  id: string
  client_name: string
  client_company: string | null
  project_description: string
  project_points_problems: string
  invoice_pdf: string | null
  payment_link: string
  created_at: string
  updated_at: string
}

export default function InvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  useEffect(() => {
    if (params.invoice_id) {
      loadInvoice()
    }
  }, [params.invoice_id])

  const loadInvoice = async () => {
    setLoading(true)
    setNotFound(false)
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', params.invoice_id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true)
        } else {
          console.error('Error loading invoice:', error)
          toast.error('Failed to load invoice')
        }
      } else {
        setInvoice(data)
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (invoice?.invoice_pdf) {
      // Create a link element and trigger download
      const link = document.createElement('a')
      link.href = invoice.invoice_pdf
      link.download = `invoice-${invoice.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      toast.error('No PDF available for download')
    }
  }

  const handlePayment = () => {
    if (invoice?.payment_link) {
      window.open(invoice.payment_link, '_blank')
    } else {
      toast.error('No payment link available')
    }
  }

  const handlePdfPreview = () => {
    if (invoice?.invoice_pdf) {
      setPdfPreviewOpen(true)
    } else {
      toast.error('No PDF available for preview')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
          <p className="text-gray-400 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Invoice</h1>
          <p className="text-gray-400 mb-6">There was an error loading the invoice. Please try again.</p>
          <button
            onClick={loadInvoice}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Details</h1>
          <p className="text-gray-400">Invoice ID: {invoice.id}</p>
        </div>

        {/* Client Information */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
              <p className="text-white">{invoice.client_name}</p>
            </div>
            {invoice.client_company && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                <p className="text-white">{invoice.client_company}</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Project Description</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{invoice.project_description}</p>
          </div>
        </div>

        {/* Main Points and Problems */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Main Points and Problems</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{invoice.project_points_problems}</p>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invoice Document</h2>
          
          {invoice.invoice_pdf ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div 
                className="flex-1 p-4 border border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
                onClick={handlePdfPreview}
              >
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-primary-400" />
                  <div>
                    <p className="text-white font-medium">Invoice PDF</p>
                    <p className="text-gray-400 text-sm">Click to preview</p>
                  </div>
                  <EyeIcon className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </div>
              
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          ) : (
            <div className="p-4 border border-dark-600 rounded-lg">
              <div className="flex items-center gap-3 text-gray-400">
                <DocumentTextIcon className="h-8 w-8" />
                <div>
                  <p className="font-medium">No PDF Available</p>
                  <p className="text-sm">Invoice PDF has not been uploaded yet</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Button */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>
          <button
            onClick={handlePayment}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CreditCardIcon className="h-5 w-5" />
            Pay Now
          </button>
        </div>

        {/* Invoice Metadata */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invoice Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-300 mb-1">Created</label>
              <p className="text-white">
                {new Date(invoice.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Last Updated</label>
              <p className="text-white">
                {new Date(invoice.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreviewOpen && invoice.invoice_pdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Invoice PDF Preview</h3>
              <button
                onClick={() => setPdfPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={invoice.invoice_pdf}
                className="w-full h-full border-0"
                title="Invoice PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
