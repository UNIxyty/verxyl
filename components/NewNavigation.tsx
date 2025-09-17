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
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import { NotificationDot } from './NotificationDot'
import { useNotifications } from '@/contexts/NotificationContext'
import { NavigationDropdown } from './NavigationDropdown'

export function NewNavigation() {
  const { user, signOut } = useAuth()
  const { notifications } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation groups organized by type
  const navigationGroups = [
    {
      title: 'Tickets',
      icon: TicketIcon,
      items: [
        { name: 'My Tickets', href: '/my-tickets', icon: TicketIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: 'myTickets' },
        { name: 'Sent Tickets', href: '/sent-tickets', icon: PaperAirplaneIcon, roles: ['admin', 'worker'], notificationKey: 'sentTickets' },
        { name: 'Completed', href: '/completed', icon: CheckCircleIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: 'completedTickets' },
        { name: 'Create Ticket', href: '/create-ticket', icon: PlusIcon, roles: ['admin', 'worker'], notificationKey: null },
      ]
    },
    {
      title: 'Projects',
      icon: FolderIcon,
      items: [
        { name: 'Projects', href: '/projects', icon: FolderIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: 'projects' },
        { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['admin', 'worker'], notificationKey: 'invoices' },
      ]
    },
    {
      title: 'Automation',
      icon: CogIcon,
      items: [
        { name: 'AI Prompts', href: '/ai-backups', icon: LightBulbIcon, roles: ['admin', 'worker'], notificationKey: 'aiPrompts' },
        { name: 'N8N Projects', href: '/n8n-backups', icon: CogIcon, roles: ['admin', 'worker'], notificationKey: 'n8nProjects' },
      ]
    },
    {
      title: 'Account',
      icon: UserIcon,
      items: [
        { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: null },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: null },
        { name: 'Admin Settings', href: '/admin-settings', icon: ShieldCheckIcon, roles: ['admin'], notificationKey: null },
      ]
    }
  ]

  // Individual items that don't belong to groups
  const individualItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'worker', 'viewer'], notificationKey: null },
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

          if (data && data.role) {
            setUserRole(data.role)
          } else {
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

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
          <Logo className="h-8" />
        </button>
        
        <div className="flex items-center space-x-3">
          <NotificationBell onNavigate={router.push} />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative bg-dark-800 w-80 h-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <Logo className="h-8" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
              {/* Individual items */}
              {individualItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`nav-link w-full justify-start relative py-3 px-3 ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.notificationKey && (
                      <NotificationDot notificationKey={item.notificationKey as any} />
                    )}
                  </button>
                )
              })}

              {/* Navigation groups */}
              {navigationGroups.map((group) => (
                <NavigationDropdown
                  key={group.title}
                  title={group.title}
                  icon={group.icon}
                  items={group.items}
                  userRole={userRole}
                  pathname={pathname}
                  onNavigate={handleNavClick}
                />
              ))}
            </div>
            
            <div className="p-4 border-t border-dark-700">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={signOut}
                  className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
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
        <div className="flex items-center justify-center h-14 px-4 border-b border-dark-700">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <Logo className="h-9" />
          </button>
        </div>
        
        <div className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {/* Individual items */}
          {individualItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`nav-link w-full justify-start relative py-3 px-3 ${
                  isActive ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
                {item.notificationKey && (
                  <NotificationDot notificationKey={item.notificationKey as any} />
                )}
              </button>
            )
          })}

          {/* Navigation groups */}
          {navigationGroups.map((group) => (
            <NavigationDropdown
              key={group.title}
              title={group.title}
              icon={group.icon}
              items={group.items}
              userRole={userRole}
              pathname={pathname}
              onNavigate={router.push}
            />
          ))}
        </div>
        
        <div className="p-3 border-t border-dark-700">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={signOut}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
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

      {/* Top Navigation Bar with Notification Bell */}
      <div className="hidden lg:block fixed top-0 right-0 z-30 bg-dark-800 border-b border-dark-700 px-6 py-3">
        <div className="flex items-center justify-end">
          <NotificationBell onNavigate={router.push} />
        </div>
      </div>
    </>
  )
}
