'use client'

import { useState } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false, 
  label,
  description,
  size = 'md' 
}: ToggleSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    if (disabled) return
    
    setIsAnimating(true)
    onChange(!checked)
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 200)
  }

  const sizeClasses = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: checked ? 'translate-x-4' : 'translate-x-0.5'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-7' : 'translate-x-0.5'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:shadow-lg'
          }
          ${checked 
            ? 'bg-primary-600 focus:ring-primary-500' 
            : 'bg-gray-600 focus:ring-gray-500'
          }
          ${isAnimating ? 'transform scale-105' : ''}
          ${currentSize.track}
        `}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out
            ${currentSize.thumb}
            ${currentSize.translate}
          `}
        />
      </button>
      
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-gray-200 cursor-pointer" onClick={handleToggle}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
