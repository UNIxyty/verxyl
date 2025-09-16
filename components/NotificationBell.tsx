'use client'

import { useState, useEffect, useRef } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  redirect_path?: string
  created_at: string
}

interface NotificationBellProps {
  onNavigate: (path: string) => void
}

export default function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10&unread_only=false')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      })

      if (response.ok) {
        setNotifications(notifications.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true })
      })

      if (response.ok) {
        setNotifications(notifications.map(notif => ({ ...notif, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate to the redirect path
    if (notification.redirect_path) {
      onNavigate(notification.redirect_path)
    }

    // Close dropdown
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_assigned':
        return '🎫'
      case 'role_changed':
        return '👤'
      case 'mail_received':
        return '📧'
      case 'project_created':
        return '📁'
      case 'invoice_created':
        return '💰'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_assigned':
        return 'text-blue-600'
      case 'role_changed':
        return 'text-purple-600'
      case 'mail_received':
        return 'text-green-600'
      case 'project_created':
        return 'text-orange-600'
      case 'invoice_created':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-primary-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  onNavigate('/notifications')
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
