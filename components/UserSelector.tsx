'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface UserSelectorProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  roleFilter?: string[] // Filter by specific roles
  excludeCurrentUser?: boolean
}

export function UserSelector({ 
  value, 
  onChange, 
  multiple = false, 
  placeholder = "Select user(s)...",
  className = "",
  disabled = false,
  roleFilter,
  excludeCurrentUser = true
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        let filteredUsers = data.users || []
        
        // Apply role filter if specified
        if (roleFilter && roleFilter.length > 0) {
          filteredUsers = filteredUsers.filter((user: User) => roleFilter.includes(user.role))
        }
        
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = user.full_name?.toLowerCase() || ''
    const email = user.email.toLowerCase()
    const role = user.role.toLowerCase()
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) || 
           role.includes(searchLower)
  })

  const handleSelect = (userId: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      if (currentValues.includes(userId)) {
        onChange(currentValues.filter(id => id !== userId))
      } else {
        onChange([...currentValues, userId])
      }
    } else {
      onChange(userId)
      setIsOpen(false)
    }
  }

  const getSelectedUsers = () => {
    if (multiple) {
      const selectedIds = Array.isArray(value) ? value : []
      return users.filter(user => selectedIds.includes(user.id))
    } else {
      return users.filter(user => user.id === value)
    }
  }

  const selectedUsers = getSelectedUsers()
  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean)

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'text-red-400'
      case 'worker': return 'text-blue-400'
      case 'viewer': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-900 text-red-300'
      case 'worker': return 'bg-blue-900 text-blue-300'
      case 'viewer': return 'bg-green-900 text-green-300'
      default: return 'bg-gray-900 text-gray-300'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedUsers.slice(0, 3).map((user) => (
                  <span key={user.id} className="inline-flex items-center gap-1 text-sm text-gray-200">
                    <UserIcon className="h-3 w-3" />
                    <span className="truncate">
                      {user.full_name || user.email}
                    </span>
                    <span className={`text-xs ${getRoleColor(user.role)}`}>
                      ({user.role})
                    </span>
                  </span>
                ))}
                {selectedUsers.length > 3 && (
                  <span className="text-sm text-gray-400">
                    +{selectedUsers.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-dark-600">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-1 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-400">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-gray-400">No users found</div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedValues.includes(user.id)
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-dark-700 transition-colors ${
                      isSelected ? 'bg-dark-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <span className={`badge text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-primary-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Role Filter */}
          {!roleFilter && (
            <div className="p-3 border-t border-dark-600">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-400">Filter by role:</span>
                {['admin', 'worker', 'viewer'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      // This would be implemented to filter by role
                      setSearchTerm(role)
                    }}
                    className={`badge text-xs px-2 py-1 rounded-full hover:opacity-80 ${getRoleBadge(role)}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
