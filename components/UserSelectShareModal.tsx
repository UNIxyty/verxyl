'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { UserIcon, MagnifyingGlassIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string
  role?: string
}

interface UserSelectShareModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (recipientEmail: string, accessRole: string) => Promise<void>
  title: string
  itemName: string
}

export function UserSelectShareModal({ isOpen, onClose, onShare, title, itemName }: UserSelectShareModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [accessRole, setAccessRole] = useState<'viewer' | 'editor'>('viewer')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Load all users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.full_name && user.full_name.toLowerCase().includes(query)) ||
      (user.role && user.role.toLowerCase().includes(query))
    )
  })

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/list?limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSearchQuery('')
    setIsDropdownOpen(false)
  }

  const handleShare = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to share with')
      return
    }

    setIsSharing(true)
    try {
      await onShare(selectedUser.email, accessRole)
      toast.success(`Successfully shared ${itemName} with ${selectedUser.email} as ${accessRole}`)
      handleClose()
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share item')
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setAccessRole('viewer')
    setSearchQuery('')
    setIsDropdownOpen(false)
    onClose()
  }

  const getUserDisplayName = (user: User) => {
    return user.full_name || user.email
  }

  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'worker': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-6">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select a user to share with
          </label>
          
          {/* Selected User Display */}
          {selectedUser ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckIcon className="h-5 w-5 text-green-400" />
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={getUserDisplayName(selectedUser)}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {getUserInitials(selectedUser)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-200">
                    {getUserDisplayName(selectedUser)}
                  </p>
                  <p className="text-sm text-gray-300">{selectedUser.email}</p>
                  {selectedUser.role && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-200"
                  disabled={isSharing}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            /* User Dropdown */
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search users by name, email, or role..."
                  className="input pl-10 pr-10"
                  disabled={isSharing}
                />
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  disabled={isSharing}
                >
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-dark-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      <span className="ml-2 text-gray-400">Loading users...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 transition-colors text-left"
                          disabled={isSharing}
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={getUserDisplayName(user)}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {getUserInitials(user)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {getUserDisplayName(user)}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            {user.role && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Access Role Selection */}
        {selectedUser && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAccessRole('viewer')}
                className={`p-3 rounded-lg border transition-colors ${
                  accessRole === 'viewer'
                    ? 'border-green-500 bg-green-900/20 text-green-200'
                    : 'border-gray-600 bg-dark-700 text-gray-300 hover:bg-gray-600'
                }`}
                disabled={isSharing}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">👁️</div>
                  <div className="text-sm font-medium">Viewer</div>
                  <div className="text-xs opacity-75">Read-only access</div>
                </div>
              </button>
              <button
                onClick={() => setAccessRole('editor')}
                className={`p-3 rounded-lg border transition-colors ${
                  accessRole === 'editor'
                    ? 'border-blue-500 bg-blue-900/20 text-blue-200'
                    : 'border-gray-600 bg-dark-700 text-gray-300 hover:bg-gray-600'
                }`}
                disabled={isSharing}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">✏️</div>
                  <div className="text-sm font-medium">Editor</div>
                  <div className="text-xs opacity-75">Can modify</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* User Count Info */}
        <div className="text-sm text-gray-400">
          {selectedUser ? (
            <p>Ready to share with selected user as {accessRole}</p>
          ) : (
            <p>{users.length} users available for sharing</p>
          )}
        </div>

        {/* Share Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="btn-secondary"
            disabled={isSharing}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedUser || isSharing}
            className="btn-primary"
          >
            {isSharing ? 'Sharing...' : `Share ${itemName}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
