'use client'

import { useAuth } from './AuthProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  TicketIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  LightBulbIcon, 
  CogIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  HomeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Create Ticket', href: '/create-ticket', icon: PlusIcon },
    { name: 'My Tickets', href: '/my-tickets', icon: TicketIcon },
    { name: 'Sent Tickets', href: '/sent-tickets', icon: PaperAirplaneIcon },
    { name: 'Completed Tickets', href: '/completed', icon: CheckCircleIcon },
    { name: 'AI Prompts', href: '/ai-backups', icon: LightBulbIcon },
    { name: 'N8N Projects', href: '/n8n-backups', icon: CogIcon },
    { name: 'Admin', href: '/admin', icon: ShieldCheckIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          console.log('Checking user role for:', user.id)
          const response = await fetch('/api/user-status')
          const data = await response.json()
          console.log('User status response:', data)
          setUserRole(data.role)
        } catch (error) {
          console.error('Error checking user role:', error)
        }
      }
    }
    checkUserRole()
  }, [user])

  if (!user) return null

  return (
    <nav className="bg-dark-800 border-r border-dark-700 w-64 min-h-screen flex flex-col">
      <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xl font-bold text-white hover:text-primary-400 transition-colors cursor-pointer"
        >
          Verxyl Tickets
        </button>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1">
        {navigation
          .filter(item => {
            // Hide Admin link for non-admin users
            if (item.name === 'Admin' && userRole !== 'admin') {
              return false
            }
            return true
          })
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`nav-link w-full justify-start ${
                  isActive ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            )
          })}
      </div>
      
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
