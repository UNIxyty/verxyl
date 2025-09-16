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

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Project {
  id: string
  title: string
  status: string
}

interface Invoice {
  id: string
  invoice_number: string
  title: string
  description: string | null
  amount: number
  currency: string
  status: string
  client_id: string | null
  project_id: string | null
  created_by: string
  due_date: string | null
  paid_date: string | null
  created_at: string
  updated_at: string
  created_by_user: User
  client: User | null
  project: Project | null
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function CreateInvoiceModal({ isOpen, onClose, onCreated }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    client_id: '',
    project_id: '',
    due_date: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Invoice title is required')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          client_id: formData.client_id || null,
          project_id: formData.project_id || null,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date || null
        })
      })

      if (response.ok) {
        toast.success('Invoice created successfully!')
        setFormData({ title: '', description: '', amount: '', currency: 'USD', client_id: '', project_id: '', due_date: '' })
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
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Invoice Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input w-full"
            placeholder="Enter invoice title..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="textarea w-full"
            placeholder="Enter invoice description..."
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              disabled={loading}
              className="input w-full"
            >
              <option value="">Select client...</option>
              {/* Add client options here if needed */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="input w-full"
              disabled={loading}
            >
              <option value="">Select project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input w-full"
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input w-full"
              disabled={loading}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="input w-full"
              disabled={loading}
            />
          </div>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'badge-low'
      case 'sent': return 'badge-primary'
      case 'paid': return 'badge-success'
      case 'overdue': return 'badge-critical'
      case 'cancelled': return 'badge-danger'
      default: return 'badge-low'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <PencilIcon className="h-4 w-4" />
      case 'sent': return <ClockIcon className="h-4 w-4" />
      case 'paid': return <CheckCircleIcon className="h-4 w-4" />
      case 'overdue': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'cancelled': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
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
                            {invoice.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`badge ${getStatusColor(invoice.status)} flex items-center gap-1`}>
                              {getStatusIcon(invoice.status)}
                              {invoice.status}
                            </span>
                            <span className="badge badge-medium">
                              {invoice.invoice_number}
                            </span>
                          </div>
                        </div>
                        
                        {invoice.description && (
                          <p className="text-gray-300 mb-3 text-sm sm:text-base">{invoice.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
                          <div>
                            <span className="font-medium">Amount:</span> {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                          <div>
                            <span className="font-medium">Client:</span> {invoice.client?.full_name || invoice.client?.email || 'No client'}
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(invoice.created_at)}
                          </div>
                        </div>

                        {invoice.project && (
                          <div className="text-sm text-gray-400 mb-4">
                            <span className="font-medium">Project:</span> {invoice.project.title}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                        <button className="btn-secondary flex items-center text-sm btn-mobile">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button className="btn-secondary flex items-center text-sm btn-mobile">
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button className="btn-secondary flex items-center text-sm btn-mobile">
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Download
                        </button>
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
