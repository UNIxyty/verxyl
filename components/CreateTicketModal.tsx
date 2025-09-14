'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { UrgencyPicker } from './UrgencyPicker'
import { UserPicker } from './UserPicker'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateTicketForm {
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  deadline_date: string
  deadline_time: string
  details: string
  assigned_to: string
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateTicketForm>({
    defaultValues: {
      urgency: undefined,
      assigned_to: ''
    }
  })

  const onSubmit = async (data: CreateTicketForm) => {
    if (!user) return

    // Validate required fields
    if (!data.urgency) {
      toast.error('Please select urgency level')
      return
    }
    if (!data.assigned_to) {
      toast.error('Please select a user to assign the ticket to')
      return
    }

    setLoading(true)
    try {
      // Combine date and time into a single deadline string
      let deadline = null
      if (data.deadline_date && data.deadline_time) {
        // Ensure time is in HH:MM format and add seconds
        const timeStr = data.deadline_time.includes(':') ? data.deadline_time : `${data.deadline_time}:00`
        deadline = `${data.deadline_date}T${timeStr}:00`
      } else if (data.deadline_date) {
        deadline = `${data.deadline_date}T00:00:00`
      }

      console.log('Creating ticket with deadline:', deadline)

      // Try to get the current session token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Session check:', { session: !!session, error: sessionError })
      
      let response;
      
      if (session?.access_token) {
        // Use authenticated API with token
        console.log('Using authenticated API with token')
        response = await fetch('/api/tickets-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            title: data.title,
            urgency: data.urgency,
            deadline: deadline,
            details: data.details,
            assigned_to: data.assigned_to
          })
        })
      } else {
        // Fallback to bypass API (uses service role to bypass RLS)
        console.log('No session token, using bypass API')
        response = await fetch('/api/tickets-bypass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            urgency: data.urgency,
            deadline: deadline,
            details: data.details,
            assigned_to: data.assigned_to,
            created_by: user.id
          })
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create ticket')
      }

      const ticket = await response.json()
      console.log('Ticket created successfully:', ticket)

      toast.success('Ticket created successfully!')
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Ticket" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { required: 'Title is required' })}
            className="input w-full"
            placeholder="Enter ticket title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-300 mb-2">
              Urgency *
            </label>
            <UrgencyPicker
              value={watch('urgency')}
              onChange={(value) => setValue('urgency', value)}
              className="w-full"
            />
            {errors.urgency && (
              <p className="mt-1 text-sm text-red-400">{errors.urgency.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-300 mb-2">
              Assign to *
            </label>
            <UserPicker
              value={watch('assigned_to')}
              onChange={(value) => setValue('assigned_to', value)}
              className="w-full"
            />
            {errors.assigned_to && (
              <p className="mt-1 text-sm text-red-400">{errors.assigned_to.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline_date" className="block text-sm font-medium text-gray-300 mb-2">
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
            <label htmlFor="deadline_time" className="block text-sm font-medium text-gray-300 mb-2">
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
          <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">
            Details *
          </label>
          <textarea
            id="details"
            rows={4}
            {...register('details', { required: 'Details are required' })}
            className="textarea w-full"
            placeholder="Describe the ticket details..."
          />
          {errors.details && (
            <p className="mt-1 text-sm text-red-400">{errors.details.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
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
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
