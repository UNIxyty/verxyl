'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { TicketViewModal } from '@/components/TicketViewModal'
import { EditTicketModal } from '@/components/EditTicketModal'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { getTicketsByCreator } from '@/lib/database'
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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
  edited: boolean
  user_notified?: boolean
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

export default function SentTicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    if (!user) return

    try {
      const ticketsData = await getTicketsByCreator(user.id)
      setTickets(ticketsData)
    } catch (error) {
      console.error('Error loading sent tickets:', error)
      toast.error('Failed to load sent tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
  }

  const handleEditTicket = (ticket: Ticket) => {
    setTicketToEdit(ticket)
    setIsEditModalOpen(true)
  }

  const handleDeleteTicket = (ticket: Ticket) => {
    console.log('Delete button clicked for ticket:', ticket.id)
    setTicketToDelete(ticket)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return

    console.log('Proceeding with deletion...')
    console.log('Ticket to delete:', ticketToDelete)
    console.log('Ticket ID:', ticketToDelete.id)
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/tickets/${ticketToDelete.id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Delete API error response:', errorData)
        throw new Error(errorData.error || 'Failed to delete ticket')
      }

      toast.success('Ticket deleted successfully!')
      loadTickets()
      setIsDeleteModalOpen(false)
      setTicketToDelete(null)
    } catch (error: any) {
      console.error('Error deleting ticket:', error)
      toast.error(error.message || 'Failed to delete ticket')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    console.log('Delete cancelled by user')
    setIsDeleteModalOpen(false)
    setTicketToDelete(null)
  }

  const handleEditSuccess = () => {
    loadTickets()
    setIsEditModalOpen(false)
    setTicketToEdit(null)
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sent Tickets</h1>
          <p className="text-gray-400">Tickets you have sent to workers</p>
        </div>

        {tickets.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">📤</div>
            <h3 className="text-lg font-medium text-white mb-2">No tickets sent</h3>
            <p className="text-gray-400">
              You haven't sent any tickets yet. Create your first ticket to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 
                        className="text-lg font-semibold text-white cursor-pointer hover:text-primary-400 transition-colors"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        {ticket.title}
                      </h3>
                      <span className={`badge ${getUrgencyColor(ticket.urgency)}`}>
                        {ticket.urgency}
                      </span>
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      {ticket.edited && (
                        <span className="badge badge-warning">
                          Edited
                        </span>
                      )}
                      {ticket.user_notified && (
                        <span className="badge badge-success">
                          User Notified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-3">{ticket.details}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Assigned to:</span> {ticket.assigned_user?.full_name || ticket.assigned_user?.email || 'Unknown'}
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
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    
                    {!ticket.edited && ticket.status !== 'completed' && (
                      <button
                        onClick={() => handleEditTicket(ticket)}
                        className="btn-primary flex items-center text-sm"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                    
                    {ticket.status !== 'completed' && (
                      <button
                        onClick={() => handleDeleteTicket(ticket)}
                        className="btn-danger flex items-center text-sm"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <TicketViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          ticket={selectedTicket}
          onStatusChange={loadTickets}
        />

        <EditTicketModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          ticket={ticketToEdit}
          onSuccess={handleEditSuccess}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Ticket"
          message={`Are you sure you want to delete "${ticketToDelete?.title}"? This action cannot be undone.`}
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  )
}
