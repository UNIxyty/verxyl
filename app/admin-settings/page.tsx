'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  ClockIcon, 
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { UserApprovalModal } from '@/components/UserApprovalModal'
import { ToggleSwitch } from '@/components/ToggleSwitch'
import { RoleChooser } from '@/components/RoleChooser'

interface User {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker' | 'viewer'
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface UsersData {
  all: User[]
  approved: User[]
  pending: User[]
  rejected: User[]
}

interface SystemSettings {
  maintenance_mode: boolean
  allow_registration: boolean
  require_approval: boolean
  max_file_size: number
  webhook_timeout: number
  webhook_base_url: string
  webhook_tickets_path: string
  webhook_users_path: string
}

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    allow_registration: true,
    require_approval: true,
    max_file_size: 10,
    webhook_timeout: 30,
    webhook_base_url: '',
    webhook_tickets_path: '',
    webhook_users_path: ''
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'users' | 'system'>('users')
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setUsersData(data.users)
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to load users')
        }
      } catch (error) {
        console.error('Error loading users:', error)
        toast.error('Failed to load users')
      }
    }

    const loadSystemSettings = async () => {
      try {
        const response = await fetch('/api/admin/system-settings')
        if (response.ok) {
          const data = await response.json()
          // Convert array of settings to object
          const settingsObj: any = {
            maintenance_mode: false,
            allow_registration: true,
            require_approval: true,
            max_file_size: 10,
            webhook_timeout: 30,
            webhook_base_url: '',
            webhook_tickets_path: '',
            webhook_users_path: ''
          }
          
          if (data.settings) {
            data.settings.forEach((setting: any) => {
              if (setting.setting_key === 'maintenance_mode' || setting.setting_key === 'allow_registration' || setting.setting_key === 'require_approval') {
                settingsObj[setting.setting_key] = setting.setting_value === 'true'
              } else if (setting.setting_key === 'max_file_size' || setting.setting_key === 'webhook_timeout') {
                settingsObj[setting.setting_key] = parseInt(setting.setting_value) || 10
              } else {
                settingsObj[setting.setting_key] = setting.setting_value || ''
              }
            })
          }
          
          setSystemSettings(settingsObj)
        }
      } catch (error) {
        console.error('Error loading system settings:', error)
      }
    }

    if (user) {
      Promise.all([loadUsers(), loadSystemSettings()]).finally(() => {
        setLoading(false)
      })
    }
  }, [user])

  const updateUserRole = async (userId: string, newRole: 'admin' | 'worker' | 'viewer') => {
    setUpdating(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        
        // Refresh users data
        const refreshResponse = await fetch('/api/admin/users')
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setUsersData(refreshData.users)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setUpdating(null)
    }
  }

  const updateSystemSetting = async (key: keyof SystemSettings, value: any) => {
    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          setting_key: key,
          setting_value: value.toString(),
          setting_type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
        })
      })

      if (response.ok) {
        setSystemSettings(prev => ({ ...prev, [key]: value }))
        toast.success('System setting updated successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update system setting')
      }
    } catch (error) {
      console.error('Error updating system setting:', error)
      toast.error('Failed to update system setting')
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setShowApprovalModal(true)
  }

  const handleUserUpdated = async () => {
    // Refresh users data
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsersData(data.users)
      }
    } catch (error) {
      console.error('Error refreshing users:', error)
    }
  }

  const handleCloseModal = () => {
    setShowApprovalModal(false)
    setSelectedUser(null)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'worker': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'rejected': return <XCircleIcon className="h-5 w-5 text-red-500" />
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400'
      case 'rejected': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const currentUsers = usersData?.[activeTab] || []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading admin settings...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-primary-400 mr-3" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Settings</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                System administration and user management
              </p>
            </div>
          </div>
          
          {/* Access Status */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <p className="text-green-200 font-medium">Admin Access Granted</p>
                <p className="text-green-100 text-sm">You have administrative privileges.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'users', label: 'Manage Users', icon: UserGroupIcon },
                { id: 'system', label: 'System Settings', icon: Cog6ToothIcon }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeSection === section.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <section.icon className="h-4 w-4 mr-2" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="mobile-grid-responsive">
              <div className="card">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-primary-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{usersData?.all.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Approved</p>
                    <p className="text-2xl font-bold text-white">{usersData?.approved.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-white">{usersData?.pending.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Rejected</p>
                    <p className="text-2xl font-bold text-white">{usersData?.rejected.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Tabs */}
            <div className="card">
              <div className="border-b border-gray-700">
                <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
                  {[
                    { id: 'approved', label: 'Approved Users', count: usersData?.approved.length || 0 },
                    { id: 'pending', label: 'Pending Approval', count: usersData?.pending.length || 0 },
                    { id: 'rejected', label: 'Rejected', count: usersData?.rejected.length || 0 }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm text-left sm:text-center ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {currentUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No {activeTab} users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentUsers.map((user) => (
                      <div 
                        key={user.id} 
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-800 rounded-lg ${
                          user.approval_status === 'pending' ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''
                        }`}
                        onClick={() => user.approval_status === 'pending' ? handleUserClick(user) : undefined}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {getStatusIcon(user.approval_status)}
                            <span className={`font-medium text-sm ${getStatusColor(user.approval_status)}`}>
                              {user.approval_status}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm sm:text-base truncate">
                              {user.full_name || user.email}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              {user.full_name && user.email} • Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                          {user.approval_status === 'approved' && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <span className="text-xs sm:text-sm text-gray-400">Role:</span>
                              <RoleChooser
                                value={user.role}
                                onChange={(role) => updateUserRole(user.id, role)}
                                disabled={updating === user.id}
                                size="sm"
                              />
                              {updating === user.id && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                              )}
                            </div>
                          )}
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Settings Section */}
        {activeSection === 'system' && (
          <div className="space-y-6">
            {/* General Settings */}
            <div className="card">
              <div className="flex items-center mb-6">
                <Cog6ToothIcon className="h-6 w-6 text-primary-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">General Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
                    <p className="text-xs text-gray-400">Disable user access during maintenance</p>
                  </div>
                  <ToggleSwitch
                    checked={systemSettings.maintenance_mode}
                    onChange={(checked) => updateSystemSetting('maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Allow Registration</label>
                    <p className="text-xs text-gray-400">Allow new users to register</p>
                  </div>
                  <ToggleSwitch
                    checked={systemSettings.allow_registration}
                    onChange={(checked) => updateSystemSetting('allow_registration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Require Approval</label>
                    <p className="text-xs text-gray-400">New users require admin approval</p>
                  </div>
                  <ToggleSwitch
                    checked={systemSettings.require_approval}
                    onChange={(checked) => updateSystemSetting('require_approval', checked)}
                  />
                </div>
              </div>
            </div>

            {/* File Settings */}
            <div className="card">
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-primary-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">File Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.max_file_size}
                    onChange={(e) => updateSystemSetting('max_file_size', parseInt(e.target.value))}
                    className="input w-full max-w-xs"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Maximum allowed file size for uploads</p>
                </div>
              </div>
            </div>

            {/* Webhook Settings */}
            <div className="card">
              <div className="flex items-center mb-6">
                <BellIcon className="h-6 w-6 text-primary-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Webhook Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={systemSettings.webhook_base_url}
                    onChange={(e) => updateSystemSetting('webhook_base_url', e.target.value)}
                    className="input w-full"
                    placeholder="https://your-domain.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">Base URL for all webhooks</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tickets Path
                  </label>
                  <input
                    type="text"
                    value={systemSettings.webhook_tickets_path}
                    onChange={(e) => updateSystemSetting('webhook_tickets_path', e.target.value)}
                    className="input w-full"
                    placeholder="/webhook/tickets"
                  />
                  <p className="text-xs text-gray-400 mt-1">Path for ticket-related webhooks</p>
                  {systemSettings.webhook_base_url && systemSettings.webhook_tickets_path && (
                    <p className="text-xs text-green-400 mt-1 font-mono">
                      Complete URL: {systemSettings.webhook_base_url}{systemSettings.webhook_tickets_path}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Users Path
                  </label>
                  <input
                    type="text"
                    value={systemSettings.webhook_users_path}
                    onChange={(e) => updateSystemSetting('webhook_users_path', e.target.value)}
                    className="input w-full"
                    placeholder="/webhook/users"
                  />
                  <p className="text-xs text-gray-400 mt-1">Path for user-related webhooks</p>
                  {systemSettings.webhook_base_url && systemSettings.webhook_users_path && (
                    <p className="text-xs text-green-400 mt-1 font-mono">
                      Complete URL: {systemSettings.webhook_base_url}{systemSettings.webhook_users_path}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.webhook_timeout}
                    onChange={(e) => updateSystemSetting('webhook_timeout', parseInt(e.target.value))}
                    className="input w-full max-w-xs"
                    min="5"
                    max="300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Timeout for webhook requests</p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="mobile-grid-responsive">
              <div className="card">
                <div className="flex items-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-red-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Admin</h3>
                </div>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• Full system access</li>
                  <li>• Manage webhook settings</li>
                  <li>• Approve/reject users</li>
                  <li>• Change user roles</li>
                  <li>• All ticket operations</li>
                </ul>
              </div>

              <div className="card">
                <div className="flex items-center mb-4">
                  <UserGroupIcon className="h-6 w-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Worker</h3>
                </div>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• Create and manage tickets</li>
                  <li>• Update ticket status</li>
                  <li>• View all tickets</li>
                  <li>• Cannot change webhook settings</li>
                  <li>• Cannot approve users</li>
                </ul>
              </div>

              <div className="card">
                <div className="flex items-center mb-4">
                  <UserIcon className="h-6 w-6 text-green-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Viewer</h3>
                </div>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• View tickets only</li>
                  <li>• Cannot create tickets</li>
                  <li>• Cannot modify tickets</li>
                  <li>• Read-only access</li>
                  <li>• Limited functionality</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* User Approval Modal */}
        <UserApprovalModal
          user={selectedUser}
          isOpen={showApprovalModal}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </DashboardLayout>
  )
}
