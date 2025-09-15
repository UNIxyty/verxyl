'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { TicketViewModal } from '@/components/TicketViewModal'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { getCompletedTickets } from '@/lib/database'
import { CheckCircleIcon, DocumentTextIcon, CogIcon, EyeIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  deadline: string | null
  details: string
  status: 'completed'
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

export default function CompletedTicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    if (!user) return

    try {
      const ticketsData = await getCompletedTickets(user.id)
      setTickets(ticketsData)
    } catch (error) {
      console.error('Error loading completed tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'badge-critical'
      case 'high': return 'badge-high'
      case 'medium': return 'badge-medium'
      case 'low': return 'badge-low'
      default: return 'badge-low'
    }
  }

  const getSolutionTypeIcon = (type: string | null) => {
    switch (type) {
      case 'prompt': return <DocumentTextIcon className="h-5 w-5" />
      case 'n8n_workflow': return <CogIcon className="h-5 w-5" />
      case 'other': return <CheckCircleIcon className="h-5 w-5" />
      default: return <CheckCircleIcon className="h-5 w-5" />
    }
  }

  const getSolutionTypeLabel = (type: string | null) => {
    switch (type) {
      case 'prompt': return 'AI Prompt'
      case 'n8n_workflow': return 'N8N Workflow'
      case 'other': return 'Other'
      default: return 'Unknown'
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

  const toggleExpanded = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId)
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
      <div className="space-y-6 sm:space-y-8 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Completed Tickets</h1>
          <p className="text-sm sm:text-base text-gray-400">Tickets you have completed</p>
        </div>

        {tickets.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No completed tickets</h3>
            <p className="text-gray-400">
              You haven't completed any tickets yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card card-responsive">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 
                        className="text-lg font-semibold text-white cursor-pointer hover:text-primary-400 transition-colors"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        {ticket.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`badge ${getUrgencyColor(ticket.urgency)}`}>
                          {ticket.urgency}
                        </span>
                        <span className="badge badge-completed">
                          completed
                        </span>
                        {ticket.solution_type && (
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            {getSolutionTypeIcon(ticket.solution_type)}
                            <span>{getSolutionTypeLabel(ticket.solution_type)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3 text-sm sm:text-base">{ticket.details}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-400 mb-4">
                      <div>
                        <span className="font-medium">Created by:</span> {ticket.created_by_user?.full_name || ticket.created_by_user?.email || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span> {formatDate(ticket.updated_at)}
                      </div>
                    </div>

                    {(ticket.solution_data || ticket.output_result) && (
                      <button
                        onClick={() => toggleExpanded(ticket.id)}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium mb-2 sm:mb-0"
                      >
                        {expandedTicket === ticket.id ? 'Hide Details' : 'Show Solution Details'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="btn-secondary flex items-center text-sm btn-mobile"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>

                {expandedTicket === ticket.id && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <div className="space-y-4">
                      {ticket.solution_type === 'prompt' && ticket.solution_data?.prompt_text && (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-300">Prompt Used:</h4>
                            <button
                              onClick={() => copyToClipboard(ticket.solution_data.prompt_text, 'Prompt')}
                              className="btn-secondary flex items-center text-xs px-2 py-1 w-full sm:w-auto"
                            >
                              <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                              Copy
                            </button>
                          </div>
                          <div className="bg-dark-700 rounded-lg p-3">
                            <p className="text-gray-200 whitespace-pre-wrap">
                              {ticket.solution_data.prompt_text}
                            </p>
                          </div>
                        </div>
                      )}

                      {ticket.solution_type === 'n8n_workflow' && ticket.solution_data?.filename && (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-300">Workflow File:</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {ticket.solution_data.workflow_json && (
                                <button
                                  onClick={() => {
                                    const jsonString = JSON.stringify(ticket.solution_data.workflow_json, null, 2)
                                    downloadFile(jsonString, `${ticket.solution_data.filename || 'workflow'}.json`, 'application/json')
                                  }}
                                  className="btn-secondary flex items-center text-xs px-2 py-1 w-full sm:w-auto"
                                >
                                  <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                  Download
                                </button>
                              )}
                              {ticket.solution_data.workflow_json && (
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(ticket.solution_data.workflow_json, null, 2), 'Workflow JSON')}
                                  className="btn-secondary flex items-center text-xs px-2 py-1 w-full sm:w-auto"
                                >
                                  <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-dark-700 rounded-lg p-3">
                            <p className="text-gray-200">
                              📄 {ticket.solution_data.filename}
                            </p>
                          </div>
                        </div>
                      )}

                      {ticket.solution_type === 'other' && ticket.solution_data?.description && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-300">Solution Description:</h4>
                            <div className="flex space-x-2">
                              {ticket.solution_data.description && (
                                <button
                                  onClick={() => copyToClipboard(ticket.solution_data.description, 'Description')}
                                  className="btn-secondary flex items-center text-xs px-2 py-1 w-full sm:w-auto"
                                >
                                  <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                                  Copy
                                </button>
                              )}
                              {ticket.solution_data.file_content && (
                                <button
                                  onClick={() => downloadFile(ticket.solution_data.file_content, ticket.solution_data.filename || 'solution.txt')}
                                  className="btn-secondary flex items-center text-xs px-2 py-1 w-full sm:w-auto"
                                >
                                  <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                  Download
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-dark-700 rounded-lg p-3">
                            <p className="text-gray-200">
                              {ticket.solution_data.description}
                            </p>
                            {ticket.solution_data.filename && (
                              <p className="text-gray-400 mt-2">
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
                          <div className="bg-dark-700 rounded-lg p-3">
                            <pre className="text-gray-200 text-sm whitespace-pre-wrap">
                              {JSON.stringify(ticket.output_result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <TicketViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          ticket={selectedTicket}
          onStatusChange={() => {}}
        />
      </div>
    </DashboardLayout>
  )
}
