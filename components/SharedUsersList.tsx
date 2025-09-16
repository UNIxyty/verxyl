'use client'

import { useState, useEffect } from 'react'
import { UserIcon, EyeIcon, PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Modal } from './Modal'

interface SharedUser {
  id: string
  access_role: 'viewer' | 'editor'
  shared_at: string
  recipient: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface SharedUsersListProps {
  backupId: string
  backupType: 'ai_prompt' | 'n8n_workflow'
  onUserRemoved?: () => void
}

export function SharedUsersList({ backupId, backupType, onUserRemoved }: SharedUsersListProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<{ user: SharedUser; isOpen: boolean }>({ user: null as any, isOpen: false })

  useEffect(() => {
    fetchSharedUsers()
  }, [backupId, backupType])

  const fetchSharedUsers = async () => {
    try {
      setIsLoading(true)
      const endpoint = backupType === 'ai_prompt' 
        ? `/api/ai-backups/shared-users?backup_id=${backupId}`
        : `/api/n8n-backups/shared-users?backup_id=${backupId}`
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setSharedUsers(data.sharedUsers || [])
      } else {
        console.error('Failed to fetch shared users')
      }
    } catch (error) {
      console.error('Error fetching shared users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveUser = async (shareId: string) => {
    const user = sharedUsers.find(u => u.id === shareId)
    if (user) {
      setConfirmRemove({ user, isOpen: true })
    }
  }

  const confirmRemoveUser = async () => {
    if (!confirmRemove.user) return

    setIsRemoving(confirmRemove.user.id)
    try {
      const endpoint = backupType === 'ai_prompt'
        ? `/api/ai-backups/unshare`
        : `/api/n8n-backups/unshare`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: confirmRemove.user.id })
      })

      if (response.ok) {
        setSharedUsers(prev => prev.filter(user => user.id !== confirmRemove.user.id))
        onUserRemoved?.()
      } else {
        console.error('Failed to remove user access')
      }
    } catch (error) {
      console.error('Error removing user access:', error)
    } finally {
      setIsRemoving(null)
      setConfirmRemove({ user: null as any, isOpen: false })
    }
  }

  const cancelRemoveUser = () => {
    setConfirmRemove({ user: null as any, isOpen: false })
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

  const getUserDisplayName = (user: SharedUser) => {
    return user.recipient.full_name || user.recipient.email
  }

  const getRoleIcon = (role: string) => {
    return role === 'editor' ? (
      <PencilIcon className="h-4 w-4 text-blue-400" />
    ) : (
      <EyeIcon className="h-4 w-4 text-green-400" />
    )
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'editor' 
      ? 'bg-blue-900/30 text-blue-300 border-blue-500/30'
      : 'bg-green-900/30 text-green-300 border-green-500/30'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-dark-700 rounded w-1/4 mb-3"></div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-dark-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (sharedUsers.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Shared With</h4>
        <div className="text-center py-6 text-gray-400">
          <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No users have access to this {backupType === 'ai_prompt' ? 'prompt' : 'workflow'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-300 mb-3">
        Shared With ({sharedUsers.length})
      </h4>
      <div className="space-y-3">
        {sharedUsers.map((sharedUser) => (
          <div
            key={sharedUser.id}
            className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-gray-600"
          >
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {sharedUser.recipient.avatar_url ? (
                  <img
                    src={sharedUser.recipient.avatar_url}
                    alt={getUserDisplayName(sharedUser)}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {getUserDisplayName(sharedUser)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {sharedUser.recipient.email}
                </p>
                <p className="text-xs text-gray-500">
                  Shared {formatDate(sharedUser.shared_at)}
                </p>
              </div>

              {/* Role Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getRoleBadgeColor(sharedUser.access_role)}`}>
                {getRoleIcon(sharedUser.access_role)}
                <span className="capitalize">{sharedUser.access_role}</span>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => handleRemoveUser(sharedUser.id)}
              disabled={isRemoving === sharedUser.id}
              className="ml-3 p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
              title="Remove access"
            >
              {isRemoving === sharedUser.id ? (
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmRemove.isOpen} onClose={cancelRemoveUser} title="Remove Access" size="sm">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-200">
                Remove Access
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-400">
                  Are you sure you want to remove access for{' '}
                  <span className="font-medium text-gray-200">
                    {confirmRemove.user && getUserDisplayName(confirmRemove.user)}
                  </span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  They will no longer be able to view or edit this {backupType === 'ai_prompt' ? 'prompt' : 'workflow'}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={cancelRemoveUser}
              className="btn-secondary"
              disabled={isRemoving === confirmRemove.user?.id}
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveUser}
              disabled={isRemoving === confirmRemove.user?.id}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              {isRemoving === confirmRemove.user?.id ? 'Removing...' : 'Remove Access'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
