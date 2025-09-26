'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  CreditCardIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function TemplateInvoicePage() {
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  // Template/placeholder data
  const templateInvoice = {
    id: 'template-invoice-123',
    client_name: 'John Smith',
    client_company: 'ABC Corporation',
    project_description: `This is a comprehensive web development project that includes:

• Frontend development using React and Next.js
• Backend API development with Node.js
• Database design and implementation
• User authentication and authorization
• Responsive design for mobile and desktop
• Performance optimization and SEO

The project scope covers all aspects of modern web application development, ensuring a robust and scalable solution that meets all business requirements.`,
    project_points_problems: `Main Points:
✓ Delivered a fully responsive web application
✓ Implemented secure user authentication system
✓ Created an intuitive admin dashboard
✓ Optimized for performance and SEO
✓ Integrated payment processing capabilities

Problems Solved:
• Resolved legacy system compatibility issues
• Fixed performance bottlenecks in data processing
• Implemented proper error handling and logging
• Enhanced security measures against common vulnerabilities
• Streamlined user workflow for better UX`,
    invoice_pdf: '#', // Placeholder PDF link
    payment_link: '#', // Placeholder payment link
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const handleDownloadPdf = () => {
    toast.success('This is a template page - PDF download would work with real data')
  }

  const handlePayment = () => {
    toast.success('This is a template page - payment redirect would work with real data')
  }

  const handlePdfPreview = () => {
    toast.success('This is a template page - PDF preview would show real PDF content')
    setPdfPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Template Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-yellow-200 font-medium">Template Invoice Page</p>
          </div>
          <p className="text-yellow-200/80 text-sm mt-1">
            This is a template page showing placeholder data. Real invoices will display actual content from the database.
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Details</h1>
          <p className="text-gray-400">Invoice ID: {templateInvoice.id}</p>
        </div>

        {/* Client Information */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
              <p className="text-white">{templateInvoice.client_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
              <p className="text-white">{templateInvoice.client_company}</p>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Project Description</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{templateInvoice.project_description}</p>
          </div>
        </div>

        {/* Main Points and Problems */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Main Points and Problems</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{templateInvoice.project_points_problems}</p>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invoice Document</h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div 
              className="flex-1 p-4 border border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
              onClick={handlePdfPreview}
            >
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-primary-400" />
                <div>
                  <p className="text-white font-medium">Invoice PDF (Template)</p>
                  <p className="text-gray-400 text-sm">Click to preview - shows placeholder content</p>
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
        </div>

        {/* Payment Button */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>
          <button
            onClick={handlePayment}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CreditCardIcon className="h-5 w-5" />
            Pay Now (Template)
          </button>
          <p className="text-gray-400 text-sm mt-2">
            In production, this button will redirect to the actual payment link.
          </p>
        </div>

        {/* Invoice Metadata */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Invoice Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-300 mb-1">Created</label>
              <p className="text-white">
                {new Date(templateInvoice.created_at).toLocaleDateString('en-US', {
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
                {new Date(templateInvoice.updated_at).toLocaleDateString('en-US', {
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

        {/* Development Info */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mt-6">
          <h3 className="text-blue-200 font-medium mb-2">Development Information</h3>
          <div className="text-blue-200/80 text-sm space-y-1">
            <p>• Template page accessible at: <code className="bg-blue-800/50 px-1 rounded">/invoices/template</code></p>
            <p>• Dynamic pages will be accessible at: <code className="bg-blue-800/50 px-1 rounded">/invoices/[invoice_id]</code></p>
            <p>• PDF preview will open real PDFs in production</p>
            <p>• Payment button will redirect to actual payment links</p>
            <p>• All data shown here is placeholder content for development</p>
          </div>
        </div>
      </div>

      {/* Template PDF Preview Modal */}
      {pdfPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Template PDF Preview</h3>
              <button
                onClick={() => setPdfPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Template PDF Preview</h4>
                <p className="text-gray-600 max-w-md">
                  This is a placeholder for the PDF preview. In production, this will display the actual invoice PDF using an iframe or PDF viewer component.
                </p>
                <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Real PDFs will be loaded from Supabase Storage and displayed here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
