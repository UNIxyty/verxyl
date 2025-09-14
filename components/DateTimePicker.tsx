'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ value, onChange, placeholder = "Select date and time", className = "" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse datetime string (YYYY-MM-DDTHH:MM format)
  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T')
      setDate(datePart || '')
      setTime(timePart || '')
    }
  }, [value])

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (newDate && time) {
      onChange(`${newDate}T${time}`)
    } else if (newDate) {
      onChange(`${newDate}T00:00`)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (date && newTime) {
      onChange(`${date}T${newTime}`)
    } else if (newTime) {
      onChange(`2024-01-01T${newTime}`) // Default date if no date selected
    }
  }

  const handleComplete = () => {
    if (date && time) {
      onChange(`${date}T${time}`)
      setIsOpen(false)
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

  const formatDisplayValue = () => {
    if (date && time) {
      const dateObj = new Date(`${date}T${time}`)
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (date) {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    return ''
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={formatDisplayValue()}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className="input w-full pr-10 cursor-pointer"
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
          {/* Tab Navigation */}
          <div className="flex border-b border-dark-600">
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm transition-colors ${
                activeTab === 'date' 
                  ? 'bg-dark-700 text-primary-400 border-b-2 border-primary-500' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-700'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Date</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm transition-colors ${
                activeTab === 'time' 
                  ? 'bg-dark-700 text-primary-400 border-b-2 border-primary-500' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-700'
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              <span>Time</span>
            </button>
          </div>

          {/* Date Picker */}
          {activeTab === 'date' && (
            <div className="p-4">
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input w-full"
              />
            </div>
          )}

          {/* Time Picker */}
          {activeTab === 'time' && (
            <div className="p-4">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="input w-full"
              />
            </div>
          )}

          {/* Action Buttons */}
          {(date || time) && (
            <div className="border-t border-dark-600 p-3">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDate('')
                    setTime('')
                    onChange('')
                  }}
                  className="flex-1 text-xs py-2 px-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!date || !time}
                  className="flex-1 text-xs py-2 px-3 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:text-gray-500 text-white rounded transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
