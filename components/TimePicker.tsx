'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({ value, onChange, placeholder = "Select time", className = "" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [time, setTime] = useState(value || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse time string (HH:MM format)
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: 0, minutes: 0 }
    const [hours, minutes] = timeStr.split(':').map(Number)
    return { hours: hours || 0, minutes: minutes || 0 }
  }

  const { hours, minutes } = parseTime(time)

  // Format time for display
  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  // Generate hours and minutes arrays
  const hoursArray = Array.from({ length: 24 }, (_, i) => i)
  const minutesArray = Array.from({ length: 60 }, (_, i) => i)

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const newTime = formatTime(newHours, newMinutes)
    setTime(newTime)
    onChange(newTime)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow typing in HH:MM format
    if (/^([0-1]?[0-9]|2[0-3]):?([0-5]?[0-9])?$/.test(inputValue)) {
      setTime(inputValue)
      if (inputValue.length === 5 && inputValue.includes(':')) {
        onChange(inputValue)
        setIsOpen(false)
      }
    }
  }

  const handleInputBlur = () => {
    if (time && time.length === 5 && time.includes(':')) {
      onChange(time)
    }
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

  // Update time when value prop changes
  useEffect(() => {
    if (value) {
      setTime(value)
    } else {
      setTime('')
    }
  }, [value])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={time}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="input w-full pr-10 cursor-pointer"
          readOnly={false}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
        >
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg">
          <div className="flex">
            {/* Hours Column */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              <div className="p-2 border-r border-dark-600">
                <div className="text-xs text-gray-400 text-center mb-2">Hours</div>
                {hoursArray.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleTimeChange(h, minutes)}
                    className={`w-full text-center py-2 px-3 rounded text-sm transition-colors ${
                      h === hours
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {h.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1 max-h-48 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-gray-400 text-center mb-2">Minutes</div>
                {minutesArray.filter((_, i) => i % 5 === 0).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeChange(hours, m)}
                    className={`w-full text-center py-2 px-3 rounded text-sm transition-colors ${
                      m === minutes
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-dark-600 p-2">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTimeChange(9, 0)}
                className="flex-1 text-xs py-2 px-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
              >
                9:00 AM
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange(12, 0)}
                className="flex-1 text-xs py-2 px-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
              >
                12:00 PM
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange(17, 0)}
                className="flex-1 text-xs py-2 px-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
              >
                5:00 PM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}