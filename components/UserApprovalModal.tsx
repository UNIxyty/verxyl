'use client'

import { useState } from 'react'
import { XMarkIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  role: 'admin' | 'worker' | 'viewer'
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface UserApprovalModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
}

export function UserApprovalModal({ user, isOpen, onClose, onUserUpdated }: UserApprovalModalProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'worker' | 'viewer'>('worker')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !user) return null

  const handleApprove = async () => {
    if (user.approval_status === 'approved') {
      toast.error('User is already approved')
      return
    }

    setLoading(true)
    try {
      // First approve the user
      const approveResponse = await fetch(`/api/users/${user.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval_status: 'approved' })
      })

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json()
        throw new Error(errorData.error || 'Failed to approve user')
      }

      // Then set the role
      const roleResponse = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole })
      })

      if (!roleResponse.ok) {
        const errorData = await roleResponse.json()
        throw new Error(errorData.error || 'Failed to set user role')
      }

      toast.success(`User approved as ${selectedRole}`)
      onUserUpdated()
      onClose()
    } catch (error) {
      console.error('Error approving user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve user')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (user.approval_status === 'rejected') {
      toast.error('User is already rejected')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval_status: 'rejected' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject user')
      }

      toast.success('User rejected')
      onUserUpdated()
      onClose()
    } catch (error) {
      console.error('Error rejecting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject user')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400'
      case 'rejected': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.approval_status === 'pending' ? 'Approve User' : 'User Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <p className={`capitalize ${getStatusColor(user.approval_status)}`}>
              {user.approval_status}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Joined
            </label>
            <p className="text-gray-900 dark:text-white">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          {user.approval_status === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="worker">Worker</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedRole === 'admin' && 'Full system access, can manage users and webhook settings'}
                {selectedRole === 'worker' && 'Can create and manage tickets, cannot access admin functions'}
                {selectedRole === 'viewer' && 'Read-only access to tickets only'}
              </p>
            </div>
          )}

          {user.approval_status === 'approved' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Role
              </label>
              <p className="text-gray-900 dark:text-white capitalize">{user.role}</p>
            </div>
          )}
        </div>

        {user.approval_status === 'pending' && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{loading ? 'Approving...' : 'Approve'}</span>
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>{loading ? 'Rejecting...' : 'Reject'}</span>
            </button>
          </div>
        )}

        {user.approval_status !== 'pending' && (
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
