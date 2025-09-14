'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface UrgencyPickerProps {
  value?: 'low' | 'medium' | 'high' | 'critical'
  onChange: (value: 'low' | 'medium' | 'high' | 'critical') => void
  placeholder?: string
  className?: string
}

const urgencyOptions = [
  {
    value: 'low' as const,
    label: 'Low',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    description: 'Can be done when convenient'
  },
  {
    value: 'medium' as const,
    label: 'Medium',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    description: 'Should be done soon'
  },
  {
    value: 'high' as const,
    label: 'High',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    description: 'Needs attention today'
  },
  {
    value: 'critical' as const,
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: 'Urgent - needs immediate attention'
  }
]

export function UrgencyPicker({ value, onChange, placeholder = "Select urgency", className = "" }: UrgencyPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = urgencyOptions.find(option => option.value === value)

  const handleSelect = (urgency: 'low' | 'medium' | 'high' | 'critical') => {
    onChange(urgency)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input w-full text-left flex items-center justify-between cursor-pointer"
      >
        {selectedOption ? (
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${selectedOption.bgColor} ${selectedOption.borderColor} border`}></div>
            <span className={selectedOption.color}>{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg">
          <div className="p-2 space-y-1">
            {urgencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-dark-700 ${
                  value === option.value ? 'bg-dark-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${option.bgColor} ${option.borderColor} border`}></div>
                  <div className="flex-1">
                    <div className={`font-medium ${option.color}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
