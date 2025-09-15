'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { UrgencyPicker } from './UrgencyPicker'
import { UserPicker } from './UserPicker'
import { getAllUsers } from '@/lib/database'
import { useAuth } from './AuthProvider'
import toast from 'react-hot-toast'

interface EditTicketForm {
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  deadline_date: string
  deadline_time: string
  details: string
  assigned_to: string
}

interface EditTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: any
  onSuccess: () => void
}

export function EditTicketModal({ isOpen, onClose, ticket, onSuccess }: EditTicketModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EditTicketForm>()

  // Load users when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUsers()
    }
  }, [isOpen, user])

  // Reset form values when ticket changes
  useEffect(() => {
    if (ticket) {
      const deadlineDate = ticket.deadline ? ticket.deadline.split('T')[0] : ''
      const deadlineTime = ticket.deadline ? ticket.deadline.split('T')[1]?.substring(0, 5) : ''
      
      const formData = {
        title: ticket.title || '',
        urgency: ticket.urgency || 'medium',
        deadline_date: deadlineDate,
        deadline_time: deadlineTime,
        details: ticket.details || '',
        assigned_to: ticket.assigned_to || ''
      }
      
      reset(formData)
    }
  }, [ticket, reset])

  // Reset form values when users are loaded (to ensure UserPicker can display the selected user)
  useEffect(() => {
    if (ticket && users.length > 0) {
      const deadlineDate = ticket.deadline ? ticket.deadline.split('T')[0] : ''
      const deadlineTime = ticket.deadline ? ticket.deadline.split('T')[1]?.substring(0, 5) : ''
      
      const formData = {
        title: ticket.title || '',
        urgency: ticket.urgency || 'medium',
        deadline_date: deadlineDate,
        deadline_time: deadlineTime,
        details: ticket.details || '',
        assigned_to: ticket.assigned_to || ''
      }
      
      console.log('Resetting form with users loaded:', {
        ticketAssignedTo: ticket.assigned_to,
        usersCount: users.length,
        formData
      })
      
      reset(formData)
    }
  }, [ticket, users, reset])

  const loadUsers = async () => {
    try {
      const usersList = await getAllUsers()
      setUsers(usersList)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    }
  }

  const onSubmit = async (data: EditTicketForm) => {
    if (!ticket?.id || !user) return

    // Validate urgency
    if (!data.urgency || !['low', 'medium', 'high', 'critical'].includes(data.urgency)) {
      toast.error('Please select a valid urgency level')
      return
    }

    // Validate assigned user
    if (!data.assigned_to) {
      toast.error('Please select a user to assign this ticket to')
      return
    }

    setLoading(true)

    try {
      // Combine date and time into deadline
      let deadline = null
      if (data.deadline_date && data.deadline_time) {
        // Ensure time is in HH:MM format and add seconds
        const timeStr = data.deadline_time.includes(':') ? data.deadline_time : `${data.deadline_time}:00`
        deadline = `${data.deadline_date}T${timeStr}:00`
      } else if (data.deadline_date) {
        deadline = `${data.deadline_date}T00:00:00`
      }

      console.log('Editing ticket with deadline:', deadline)

      const response = await fetch(`/api/tickets/${ticket.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          urgency: data.urgency,
          deadline: deadline,
          details: data.details,
          assigned_to: data.assigned_to
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update ticket')
      }

      toast.success('Ticket updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating ticket:', error)
      if (error.message?.includes('already been edited')) {
        toast.error('This ticket has already been edited and cannot be modified again.')
      } else {
        toast.error('Failed to update ticket')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!loading) {
          handleSubmit(onSubmit)()
        }
      }
    }

    // Only add event listener when modal is open
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, loading, handleSubmit, onSubmit])

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Ticket" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="input w-full"
            placeholder="Enter ticket title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Urgency *
          </label>
          <UrgencyPicker
            value={watch('urgency')}
            onChange={(value) => setValue('urgency', value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Assigned To *
          </label>
          <UserPicker
            value={watch('assigned_to')}
            onChange={(value) => setValue('assigned_to', value)}
            users={users}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline Date
            </label>
            <DatePicker
              value={watch('deadline_date')}
              onChange={(value) => setValue('deadline_date', value)}
              placeholder="Select date"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline Time
            </label>
            <TimePicker
              value={watch('deadline_time')}
              onChange={(value) => setValue('deadline_time', value)}
              placeholder="Select time"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Details *
          </label>
          <textarea
            {...register('details', { required: 'Details are required' })}
            rows={4}
            className="input w-full textarea"
            placeholder="Enter ticket details"
          />
          {errors.details && (
            <p className="mt-1 text-sm text-red-400">{errors.details.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Ticket'}
            <span className="ml-2 text-xs opacity-70">
              (⌘+Enter)
            </span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
