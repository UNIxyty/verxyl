'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface RoleChooserProps {
  value: 'admin' | 'worker' | 'viewer'
  onChange: (role: 'admin' | 'worker' | 'viewer') => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RoleChooser({ 
  value, 
  onChange, 
  disabled = false, 
  size = 'md' 
}: RoleChooserProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 min-w-32',
    md: 'text-sm px-4 py-3 min-w-40',
    lg: 'text-base px-5 py-4 min-w-48'
  }

  const roleConfig = {
    admin: {
      label: 'Admin',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: '👑'
    },
    worker: {
      label: 'Worker',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: '🔧'
    },
    viewer: {
      label: 'Viewer',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: '👁️'
    }
  }

  const currentRole = roleConfig[value]

  const handleSelect = (role: 'admin' | 'worker' | 'viewer') => {
    onChange(role)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full
          bg-gray-700 border border-gray-600 rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary-500
          transition-colors duration-200
          ${sizeClasses[size]}
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:bg-gray-600'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{currentRole.icon}</span>
          <span className="text-white font-medium">{currentRole.label}</span>
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
            {Object.entries(roleConfig).map(([role, config]) => (
              <button
                key={role}
                type="button"
                onClick={() => handleSelect(role as any)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 text-left
                  hover:bg-gray-600 transition-colors duration-150
                  ${value === role ? 'bg-gray-600' : ''}
                `}
              >
                <span className="text-base">{config.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {role === 'admin' && 'Full system access'}
                    {role === 'worker' && 'Create and manage tickets'}
                    {role === 'viewer' && 'View tickets only'}
                  </div>
                </div>
                {value === role && (
                  <div className="text-primary-400 text-sm">✓</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
