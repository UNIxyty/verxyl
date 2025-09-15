'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { CompleteTicketModal } from '@/components/CompleteTicketModal'
import { TicketViewModal } from '@/components/TicketViewModal'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { PlayIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
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

export default function MyTicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
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
      const response = await fetch('/api/tickets/my-tickets')
      const ticketsData = await response.json()
      setTickets(ticketsData)
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWork = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update ticket')
      }
      
      toast.success('Ticket started!')
      loadTickets()
    } catch (error) {
      console.error('Error starting ticket:', error)
      toast.error('Failed to start ticket')
    }
  }

  const handleCompleteTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsCompleteModalOpen(true)
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
  }

  const handleCompleteSuccess = () => {
    loadTickets()
    setSelectedTicketId(null)
    setIsCompleteModalOpen(false)
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
      month: 'short',
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
      <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Tickets</h1>
          <p className="text-sm sm:text-base text-gray-400">Tickets assigned to you</p>
        </div>

        {tickets.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No tickets assigned</h3>
            <p className="text-gray-400">
              You don't have any tickets assigned to you yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
                <div key={ticket.id} className="card card-responsive">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
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
                        <span className={`badge ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3 text-sm sm:text-base">{ticket.details}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Created by:</span> {ticket.created_by_user?.full_name || ticket.created_by_user?.email || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(ticket.created_at)}
                      </div>
                      {ticket.deadline && (
                        <div>
                          <span className="font-medium">Deadline:</span> 
                          <span className={getDeadlineColor(ticket.deadline)}> {formatDate(ticket.deadline)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="btn-secondary flex items-center text-sm btn-mobile"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    
                    {ticket.status === 'new' && (
                      <button
                        onClick={() => handleStartWork(ticket.id)}
                        className="btn-primary flex items-center text-sm btn-mobile"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start Work
                      </button>
                    )}
                    
                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteTicket(ticket.id)}
                        className="btn-primary flex items-center text-sm btn-mobile"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CompleteTicketModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          ticketId={selectedTicketId || ''}
          onSuccess={handleCompleteSuccess}
        />

        <TicketViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          ticket={selectedTicket}
          onStatusChange={loadTickets}
        />
      </div>
    </DashboardLayout>
  )
}
