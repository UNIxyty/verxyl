'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { NotificationDot } from './NotificationDot'
import { useNotifications } from '@/contexts/NotificationContext'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
  notificationKey?: string | null
}

interface NavigationDropdownProps {
  title: string
  icon: any
  items: NavigationItem[]
  userRole: string | null
  pathname: string
  onNavigate: (href: string) => void
}

export function NavigationDropdown({ 
  title, 
  icon: Icon, 
  items, 
  userRole, 
  pathname, 
  onNavigate 
}: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications } = useNotifications()

  // Filter items based on user role
  const filteredItems = items.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  // Don't render if no items are available for this user
  if (filteredItems.length === 0) {
    return null
  }

  // Check if any item in this dropdown is active
  const hasActiveItem = filteredItems.some(item => pathname === item.href)

  // Check if any item has notifications
  const hasNotifications = filteredItems.some(item => 
    item.notificationKey && notifications[item.notificationKey as keyof typeof notifications] > 0
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-link w-full justify-start relative ${
          hasActiveItem ? 'nav-link-active' : 'nav-link-inactive'
        }`}
      >
        <Icon className="mr-3 h-5 w-5" />
        {title}
        <ChevronDownIcon 
          className={`ml-auto h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
        {hasNotifications && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            !
          </div>
        )}
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-600 pl-4">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => {
                  onNavigate(item.href)
                  setIsOpen(false)
                }}
                className={`nav-link w-full justify-start relative text-sm ${
                  isActive ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
                {item.notificationKey && (
                  <NotificationDot notificationKey={item.notificationKey as any} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
