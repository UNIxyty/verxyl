'use client'

import { useNotifications } from '@/contexts/NotificationContext'

interface NotificationDotProps {
  notificationKey: keyof ReturnType<typeof useNotifications>['notifications']
  className?: string
}

export function NotificationDot({ notificationKey, className = '' }: NotificationDotProps) {
  const { notifications } = useNotifications()
  const count = notifications[notificationKey]

  if (count === 0) return null

  return (
    <div className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${className}`}>
      {count > 99 ? '99+' : count}
    </div>
  )
}
