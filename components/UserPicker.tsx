'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline'
import { getAllUsers } from '@/lib/database'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface UserPickerProps {
  value?: string
  onChange: (userId: string) => void
  placeholder?: string
  className?: string
  users?: User[]
}

export function UserPicker({ value, onChange, placeholder = "Select user", className = "", users: propUsers }: UserPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalUsers, setInternalUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use prop users if provided, otherwise use internal users
  const users = propUsers || internalUsers
  const selectedUser = users.find(user => user.id === value)

  // Load users when dropdown opens (only if no prop users provided)
  useEffect(() => {
    if (isOpen && !propUsers && internalUsers.length === 0) {
      loadUsers()
    }
  }, [isOpen, propUsers, internalUsers.length])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const userList = await getAllUsers()
      setInternalUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (userId: string) => {
    onChange(userId)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const getUserDisplayName = (user: User) => {
    return user.full_name || user.email
  }

  const getUserInitials = (user: User) => {
    const name = user.full_name || user.email
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input w-full text-left flex items-center justify-between cursor-pointer"
      >
        {selectedUser ? (
          <div className="flex items-center space-x-3">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={getUserDisplayName(selectedUser)}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white">
                {getUserInitials(selectedUser)}
              </div>
            )}
            <span className="text-gray-100">{getUserDisplayName(selectedUser)}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-dark-600">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="input w-full text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Users List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-sm">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'No users found' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-dark-700 ${
                      value === user.id ? 'bg-dark-700' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={getUserDisplayName(user)}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm text-white">
                          {getUserInitials(user)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-100 font-medium truncate">
                          {getUserDisplayName(user)}
                        </div>
                        {user.full_name && (
                          <div className="text-gray-400 text-sm truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
