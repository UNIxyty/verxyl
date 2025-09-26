'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { 
  DocumentTextIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Modal } from '@/components/Modal'

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

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function CreateInvoiceModal({ isOpen, onClose, onCreated }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    project_description: '',
    project_points_problems: '',
    invoice_pdf: '',
    payment_link: ''
  })

  const handleCreate = async () => {
    if (!formData.client_name.trim()) {
      toast.error('Client name is required')
      return
    }

    if (!formData.project_description.trim()) {
      toast.error('Project description is required')
      return
    }

    if (!formData.project_points_problems.trim()) {
      toast.error('Project points and problems are required')
      return
    }

    if (!formData.payment_link.trim()) {
      toast.error('Payment link is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Invoice created successfully!')
        setFormData({
          client_name: '',
          client_company: '',
          project_description: '',
          project_points_problems: '',
          invoice_pdf: '',
          payment_link: ''
        })
        onCreated()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="input w-full"
              placeholder="Enter client name..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Company
            </label>
            <input
              type="text"
              value={formData.client_company}
              onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
              className="input w-full"
              placeholder="Enter client company..."
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Description *
          </label>
          <textarea
            rows={4}
            value={formData.project_description}
            onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
            className="textarea w-full"
            placeholder="Enter detailed project description..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Points and Problems *
          </label>
          <textarea
            rows={4}
            value={formData.project_points_problems}
            onChange={(e) => setFormData({ ...formData, project_points_problems: e.target.value })}
            className="textarea w-full"
            placeholder="Enter main points and problems addressed..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Invoice PDF URL
          </label>
          <input
            type="url"
            value={formData.invoice_pdf}
            onChange={(e) => setFormData({ ...formData, invoice_pdf: e.target.value })}
            className="input w-full"
            placeholder="https://your-storage.com/invoice.pdf"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            URL to the invoice PDF file (e.g., from Supabase Storage)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Payment Link *
          </label>
          <input
            type="url"
            value={formData.payment_link}
            onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
            className="input w-full"
            placeholder="https://payment-processor.com/pay/..."
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            URL where clients can make payments (Stripe, PayPal, etc.)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-mobile"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary btn-mobile"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadInvoices()
    }
  }, [user])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/invoices?limit=50')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      } else {
        toast.error('Failed to load invoices')
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/invoices/${invoiceId}`, '_blank')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Invoices</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage your invoices and track payments
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center btn-mobile"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Invoice
          </button>
        </div>

        <div className="card">
          <div className="p-4 sm:p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No invoices found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="card card-responsive"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {invoice.client_name}
                            {invoice.client_company && ` - ${invoice.client_company}`}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="badge badge-primary text-xs">
                              {invoice.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-3 text-sm line-clamp-2">
                          {invoice.project_description}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                          <div>
                            <span className="font-medium">Client:</span> {invoice.client_name}
                          </div>
                          <div>
                            <span className="font-medium">Company:</span> {invoice.client_company || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(invoice.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Updated:</span> {formatDate(invoice.updated_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <DocumentTextIcon className="h-4 w-4" />
                            <span>PDF: {invoice.invoice_pdf ? 'Available' : 'Not uploaded'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>Payment: {invoice.payment_link ? 'Ready' : 'Not set'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                        <button 
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="btn-secondary flex items-center text-sm btn-mobile"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center text-sm btn-mobile"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            PDF
                          </a>
                        )}
                        <a
                          href={invoice.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex items-center text-sm btn-mobile"
                        >
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          Pay
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <CreateInvoiceModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={loadInvoices}
        />
      </div>
    </DashboardLayout>
  )
}
