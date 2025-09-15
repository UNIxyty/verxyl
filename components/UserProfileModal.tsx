'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { 
  UserIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon, 
  CalendarIcon,
  PaperAirplaneIcon,
  TicketIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  approval_status: string
  avatar_url?: string | null
}

interface UserStats {
  tickets_created: number
  tickets_assigned: number
  tickets_completed: number
  mails_sent: number
  mails_received: number
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onSendMail?: (userId: string) => void
}

export function UserProfileModal({ isOpen, onClose, userId, onSendMail }: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile()
    }
  }, [isOpen, userId])

  const loadUserProfile = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Load user details
      const userResponse = await fetch(`/api/users/${userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
      }

      // Load user stats
      const statsResponse = await fetch(`/api/users/${userId}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'text-red-400 bg-red-900/20'
      case 'worker': return 'text-blue-400 bg-blue-900/20'
      case 'viewer': return 'text-green-400 bg-green-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-green-400 bg-green-900/20'
      case 'pending': return 'text-yellow-400 bg-yellow-900/20'
      case 'rejected': return 'text-red-400 bg-red-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  if (!isOpen || !userId) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="lg">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-dark-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-dark-700 rounded w-32"></div>
              <div className="h-3 bg-dark-700 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* User Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {user.full_name || 'User'}
                </h3>
                <p className="text-gray-400 flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>

            {onSendMail && (
              <button
                onClick={() => onSendMail(user.id)}
                className="btn-primary flex items-center gap-2 btn-mobile"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Send Mail
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-300">Role</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                  <ShieldCheckIcon className="h-4 w-4" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Status</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.approval_status)}`}>
                  <CheckCircleIcon className="h-4 w-4" />
                  {user.approval_status.charAt(0).toUpperCase() + user.approval_status.slice(1)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Member Since</label>
              <div className="flex items-center gap-2 text-gray-200">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(user.created_at)}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Activity Statistics</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TicketIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.tickets_created}</p>
                  <p className="text-sm text-gray-400">Tickets Created</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.tickets_assigned}</p>
                  <p className="text-sm text-gray-400">Tickets Assigned</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.tickets_completed}</p>
                  <p className="text-sm text-gray-400">Tickets Completed</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <PaperAirplaneIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.mails_sent}</p>
                  <p className="text-sm text-gray-400">Mails Sent</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <EnvelopeIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.mails_received}</p>
                  <p className="text-sm text-gray-400">Mails Received</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">User not found</p>
        </div>
      )}
    </Modal>
  )
}
