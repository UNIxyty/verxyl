'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { UserIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (recipientEmail: string) => Promise<void>
  title: string
  itemName: string
}

export function ShareModal({ isOpen, onClose, onShare, title, itemName }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error searching users:', error)
        toast.error('Failed to search users')
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSearchQuery(user.email)
    setUsers([])
  }

  const handleShare = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to share with')
      return
    }

    setIsSharing(true)
    try {
      await onShare(selectedUser.email)
      toast.success(`Successfully shared ${itemName} with ${selectedUser.email}`)
      handleClose()
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share item')
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setUsers([])
    setSelectedUser(null)
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search for a user to share with
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter email or name..."
              className="input pl-10"
              disabled={isSharing}
            />
          </div>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-400">Searching...</span>
          </div>
        )}

        {!isSearching && users.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Select a user:</p>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
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
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-200">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected User */}
        {selectedUser && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-200">Selected User</p>
                <p className="text-sm text-gray-300">
                  {getUserDisplayName(selectedUser)} ({selectedUser.email})
                </p>
              </div>
            </div>
          </div>
        )}

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
