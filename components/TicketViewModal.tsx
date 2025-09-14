'use client'

import { Modal } from './Modal'
import { PlayIcon, CheckCircleIcon, XMarkIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { updateTicket } from '@/lib/database'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  deadline: string | null
  details: string
  status: 'new' | 'in_progress' | 'completed'
  assigned_to: string
  created_by: string
  solution_type?: 'prompt' | 'n8n_workflow' | 'other' | null
  solution_data?: any | null
  output_result?: any | null
  created_at: string
  updated_at: string
  created_by_user?: {
    full_name: string | null
    email: string
  }
  assigned_user?: {
    full_name: string | null
    email: string
  }
}

interface TicketViewModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
  onStatusChange: () => void
}

export function TicketViewModal({ isOpen, onClose, ticket, onStatusChange }: TicketViewModalProps) {
  if (!ticket) return null

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'badge-critical'
      case 'high': return 'badge-high'
      case 'medium': return 'badge-medium'
      case 'low': return 'badge-low'
      default: return 'badge-low'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'badge-new'
      case 'in_progress': return 'badge-in-progress'
      case 'completed': return 'badge-completed'
      default: return 'badge-new'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return 'text-gray-400'
    
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) return 'text-red-400'
    if (diffHours < 24) return 'text-orange-400'
    return 'text-gray-400'
  }

  const handleStartWork = async () => {
    try {
      await updateTicket(ticket.id, { status: 'in_progress' })
      toast.success('Ticket started!')
      onStatusChange()
      onClose()
    } catch (error) {
      console.error('Error starting ticket:', error)
      toast.error('Failed to start ticket')
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket.title} size="xl">
      <div className="space-y-6">
        {/* Header with status and urgency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`badge ${getUrgencyColor(ticket.urgency)}`}>
              {ticket.urgency}
            </span>
            <span className={`badge ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            {ticket.solution_type && (
              <span className="badge bg-purple-900 text-purple-300">
                {ticket.solution_type.replace('_', ' ')}
              </span>
            )}
          </div>
          
          {ticket.status === 'new' && (
            <button
              onClick={handleStartWork}
              className="btn-primary flex items-center"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              Start Work
            </button>
          )}
        </div>

        {/* Ticket Details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{ticket.details}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-400">Created by:</span>
                <p className="text-gray-200">
                  {ticket.created_by_user?.full_name || ticket.created_by_user?.email || 'Unknown'}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-400">Assigned to:</span>
                <p className="text-gray-200">
                  {ticket.assigned_user?.full_name || ticket.assigned_user?.email || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-400">Created:</span>
                <p className="text-gray-200">{formatDate(ticket.created_at)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-400">Last updated:</span>
                <p className="text-gray-200">{formatDate(ticket.updated_at)}</p>
              </div>
              
              {ticket.deadline && (
                <div>
                  <span className="text-sm font-medium text-gray-400">Deadline:</span>
                  <p className={getDeadlineColor(ticket.deadline)}>
                    {formatDate(ticket.deadline)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solution Details (for completed tickets) */}
        {ticket.status === 'completed' && (ticket.solution_data || ticket.output_result) && (
          <div className="border-t border-dark-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Solution Details</h3>
            
            {ticket.solution_type === 'prompt' && ticket.solution_data?.prompt_text && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">Prompt Used:</h4>
                  <button
                    onClick={() => copyToClipboard(ticket.solution_data.prompt_text, 'Prompt')}
                    className="btn-secondary flex items-center text-xs px-2 py-1"
                  >
                    <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <p className="text-gray-200 whitespace-pre-wrap">
                    {ticket.solution_data.prompt_text}
                  </p>
                </div>
              </div>
            )}

            {ticket.solution_type === 'n8n_workflow' && ticket.solution_data && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">N8N Workflow:</h4>
                  <div className="flex space-x-2">
                    {ticket.solution_data.workflow_json && (
                      <button
                        onClick={() => {
                          const jsonString = JSON.stringify(ticket.solution_data.workflow_json, null, 2)
                          downloadFile(jsonString, `${ticket.solution_data.filename || 'workflow'}.json`, 'application/json')
                        }}
                        className="btn-secondary flex items-center text-xs px-2 py-1"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    )}
                    {ticket.solution_data.workflow_json && (
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(ticket.solution_data.workflow_json, null, 2), 'Workflow JSON')}
                        className="btn-secondary flex items-center text-xs px-2 py-1"
                      >
                        <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                        Copy
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  {ticket.solution_data.filename && (
                    <p className="text-gray-200 mb-2">
                      📄 File: {ticket.solution_data.filename}
                    </p>
                  )}
                  {ticket.solution_data.workflow_json && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Workflow JSON:</p>
                      <pre className="text-gray-200 text-sm overflow-auto max-h-40">
                        {JSON.stringify(ticket.solution_data.workflow_json, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ticket.solution_type === 'other' && ticket.solution_data && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">Solution Description:</h4>
                  <div className="flex space-x-2">
                    {ticket.solution_data.description && (
                      <button
                        onClick={() => copyToClipboard(ticket.solution_data.description, 'Description')}
                        className="btn-secondary flex items-center text-xs px-2 py-1"
                      >
                        <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                        Copy
                      </button>
                    )}
                    {ticket.solution_data.file_content && (
                      <button
                        onClick={() => downloadFile(ticket.solution_data.file_content, ticket.solution_data.filename || 'solution.txt')}
                        className="btn-secondary flex items-center text-xs px-2 py-1"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  {ticket.solution_data.description && (
                    <p className="text-gray-200 mb-2">
                      {ticket.solution_data.description}
                    </p>
                  )}
                  {ticket.solution_data.filename && (
                    <p className="text-gray-400">
                      📄 File: {ticket.solution_data.filename}
                    </p>
                  )}
                </div>
              </div>
            )}

            {ticket.output_result && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">Output Result:</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const jsonString = JSON.stringify(ticket.output_result, null, 2)
                        downloadFile(jsonString, `output-result-${ticket.id}.json`, 'application/json')
                      }}
                      className="btn-secondary flex items-center text-xs px-2 py-1"
                    >
                      <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(ticket.output_result, null, 2), 'Output Result')}
                      className="btn-secondary flex items-center text-xs px-2 py-1"
                    >
                      <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <pre className="text-gray-200 text-sm whitespace-pre-wrap overflow-auto max-h-40">
                    {JSON.stringify(ticket.output_result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
