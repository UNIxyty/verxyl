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
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

export function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'worker', 'viewer'] },
    { name: 'Create Ticket', href: '/create-ticket', icon: PlusIcon, roles: ['admin', 'worker'] },
    { name: 'My Tickets', href: '/my-tickets', icon: TicketIcon, roles: ['admin', 'worker', 'viewer'] },
    { name: 'Sent Tickets', href: '/sent-tickets', icon: PaperAirplaneIcon, roles: ['admin', 'worker'] },
    { name: 'Completed Tickets', href: '/completed', icon: CheckCircleIcon, roles: ['admin', 'worker', 'viewer'] },
    { name: 'Projects', href: '/projects', icon: FolderIcon, roles: ['admin', 'worker', 'viewer'] },
    { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['admin', 'worker'] },
    { name: 'AI Prompts', href: '/ai-backups', icon: LightBulbIcon, roles: ['admin', 'worker'] },
    { name: 'N8N Projects', href: '/n8n-backups', icon: CogIcon, roles: ['admin', 'worker'] },
    { name: 'Admin', href: '/admin', icon: ShieldCheckIcon, roles: ['admin'] },
    { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['admin', 'worker', 'viewer'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin', 'worker', 'viewer'] },
  ]

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          console.log('Checking user role for:', user.id)
          const response = await fetch('/api/user-status')
          
          if (!response.ok) {
            console.error('User status API failed:', response.status, response.statusText)
            setUserRole(null)
            return
          }

          const data = await response.json()
          console.log('User status response:', data)

          // If backend signals that the user needs registration, do not treat as an error
          if (data && data.needsRegistration) {
            setUserRole(null)
            return
          }

          if (data && typeof data.role === 'string') {
            setUserRole(data.role)
          } else {
            // Gracefully handle missing/invalid role without noisy errors
            setUserRole(null)
          }
        } catch (error) {
          console.error('Error checking user role:', error)
          setUserRole(null)
        }
      }
    }
    checkUserRole()
  }, [user])

  if (!user) return null

  const filteredNavigation = navigation.filter(item => {
    if (userRole && item.roles) {
      return item.roles.includes(userRole)
    }
    return true
  })

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-dark-800 border-b border-dark-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <Logo className="h-7" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-dark-800 border-r border-dark-700 w-56 min-h-screen flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700">
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                <Logo className="h-8" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 px-3 py-4 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
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
              <div className="flex items-center justify-between mb-3">
                <NotificationBell onNavigate={router.push} />
                <button
                  onClick={signOut}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
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
                  {userRole && typeof userRole === 'string' && userRole.length > 0 && (
                    <p className="text-xs text-primary-400 truncate">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex bg-dark-800 border-r border-dark-700 w-56 min-h-screen flex-col fixed left-0 top-0 z-40">
        <div className="flex items-center h-14 px-4 border-b border-dark-700">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <Logo className="h-7" />
          </button>
        </div>
        
        <div className="flex-1 px-2 py-3 space-y-1">
          {filteredNavigation.map((item) => {
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
        
        <div className="p-3 border-t border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <NotificationBell onNavigate={router.push} />
            <button
              onClick={signOut}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
              {userRole && typeof userRole === 'string' && userRole.length > 0 && (
                <p className="text-xs text-primary-400 truncate">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </p>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
