'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ThemePicker } from '@/components/ThemePicker'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { ToggleSwitch } from '@/components/ToggleSwitch'
import { useEffect, useState } from 'react'
import { Cog6ToothIcon, PaintBrushIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Notification types - updated to match webhook structure
type NotificationKey =
  | 'newTicket'
  | 'deleted_ticket'
  | 'in_work_ticket'
  | 'updatetTicket'
  | 'solvedTicket'
  | 'sharedWorkflow'
  | 'sharedPrompt'

type NotificationSettings = Record<NotificationKey, boolean>

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isWebhookLoading, setIsWebhookLoading] = useState(false)
  const [isWebhookSaving, setIsWebhookSaving] = useState(false)

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newTicket: true,
    deleted_ticket: true,
    in_work_ticket: true,
    updatetTicket: true,
    solvedTicket: true,
    sharedWorkflow: true,
    sharedPrompt: true
  })
  const [isNotificationLoading, setIsNotificationLoading] = useState(false)
  const [isNotificationSaving, setIsNotificationSaving] = useState(false)

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user-status')
          const data = await response.json()
          setUserRole(data.role)
        } catch (error) {
          console.error('Error checking user role:', error)
        }
      }
    }
    checkUserRole()
  }, [user])

  // Load webhook settings
  useEffect(() => {
    const loadWebhookSettings = async () => {
      if (user) {
        setIsWebhookLoading(true)
        try {
          const response = await fetch('/api/users/me')
          if (response.ok) {
            const data = await response.json()
            setWebhookUrl(data.user.webhook_url || '')
          }
        } catch (error) {
          console.error('Error loading webhook settings:', error)
        } finally {
          setIsWebhookLoading(false)
        }
      }
    }
    loadWebhookSettings()
  }, [user])

  // Load notification settings from user profile
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (user) {
        setIsNotificationLoading(true)
        try {
          const response = await fetch('/api/users/me')
          if (response.ok) {
            const data = await response.json()
            const userData = data.user
            if (userData) {
              setNotificationSettings({
                newTicket: userData.new_ticket ?? true,
                deleted_ticket: userData.deleted_ticket ?? true,
                in_work_ticket: userData.in_work_ticket ?? true,
                updatetTicket: userData.updated_ticket ?? true,
                solvedTicket: userData.solved_ticket ?? true,
                sharedWorkflow: userData.shared_workflow ?? true,
                sharedPrompt: userData.shared_prompt ?? true
              })
            }
          }
        } catch (error) {
          console.error('Error loading notification settings:', error)
        } finally {
          setIsNotificationLoading(false)
        }
      }
    }
    loadNotificationSettings()
  }, [user])

  const handleNotificationChange = (key: NotificationKey, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleWebhookSave = async () => {
    setIsWebhookSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl
        })
      })

      if (response.ok) {
        toast.success('Webhook settings saved successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save webhook settings')
      }
    } catch (error) {
      console.error('Error saving webhook settings:', error)
      toast.error('Failed to save webhook settings')
    } finally {
      setIsWebhookSaving(false)
    }
  }

  const handleNotificationSave = async () => {
    setIsNotificationSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_ticket: notificationSettings.newTicket,
          deleted_ticket: notificationSettings.deleted_ticket,
          in_work_ticket: notificationSettings.in_work_ticket,
          updated_ticket: notificationSettings.updatetTicket,
          solved_ticket: notificationSettings.solvedTicket,
          shared_workflow: notificationSettings.sharedWorkflow,
          shared_prompt: notificationSettings.sharedPrompt
        })
      })

      if (response.ok) {
        toast.success('Notification settings saved successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save notification settings')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Failed to save notification settings')
    } finally {
      setIsNotificationSaving(false)
    }
  }


  const isAdmin = userRole === 'admin'
  const isWorker = userRole === 'worker'
  const isViewer = userRole === 'viewer'


  return (
    <DashboardLayout>
        <div className="w-full max-w-4xl overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Customize your Verxyl Ticket Management experience
          </p>
        </div>

        <div className="space-y-8">


          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Notification Settings</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Choose which notifications you want to receive
                </p>
              </div>
            </div>

            {isNotificationLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-dark-700 rounded w-1/3"></div>
                    <div className="h-6 bg-dark-700 rounded w-12"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: 'newTicket', label: 'New Ticket', description: 'When a new ticket is created' },
                    { key: 'deleted_ticket', label: 'Deleted Ticket', description: 'When a ticket is deleted' },
                    { key: 'in_work_ticket', label: 'In Work Ticket', description: 'When work starts on a ticket' },
                    { key: 'updatetTicket', label: 'Updated Ticket', description: 'When a ticket is updated' },
                    { key: 'solvedTicket', label: 'Solved Ticket', description: 'When a ticket is marked as solved' },
                    { key: 'sharedWorkflow', label: 'Shared N8N Workflow', description: 'When an N8N workflow is shared with you' },
                    { key: 'sharedPrompt', label: 'Shared AI Prompt', description: 'When an AI prompt is shared with you' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-gray-600">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-200 mb-1">
                          {setting.label}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={notificationSettings[setting.key as NotificationKey]}
                        onChange={(checked) => handleNotificationChange(setting.key as NotificationKey, checked)}
                        disabled={isNotificationSaving}
                        size="md"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-end pt-4">
                  <button
                    onClick={handleNotificationSave}
                    disabled={isNotificationLoading || isNotificationSaving}
                    className="btn-primary btn-mobile"
                  >
                    {isNotificationSaving ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Webhook Settings */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Webhook Settings</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Configure webhook URL for ticket notifications
                </p>
              </div>
            </div>

            {isWebhookLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-dark-700 rounded mb-4"></div>
                <div className="h-10 bg-dark-700 rounded w-32"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-webhook-url.com/endpoint"
                    className="input w-full"
                    disabled={isWebhookSaving}
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    URL to receive ticket notifications (optional)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end">
                  <button
                    onClick={handleWebhookSave}
                    disabled={isWebhookLoading || isWebhookSaving}
                    className="btn-primary btn-mobile"
                  >
                    {isWebhookSaving ? 'Saving...' : 'Save Webhook Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Settings */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Admin Settings</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  System administration and user management
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-200 text-sm">
                    <strong>Admin Access Granted</strong><br />
                    You have administrative privileges.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => window.open('/admin/users', '_blank')}
                    className="btn-secondary btn-mobile"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => window.open('/admin/system-settings', '_blank')}
                    className="btn-secondary btn-mobile"
                  >
                    System Settings
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  <strong>Access Denied</strong><br />
                  You are not an administrator. Contact your system administrator for access.
                </p>
              </div>
            )}
          </div>

          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <PaintBrushIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Theme Settings</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Choose your preferred color theme
                </p>
              </div>
            </div>

            <ThemePicker currentTheme={theme} onThemeChange={setTheme} />
          </div>

          {/* Application Info */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Application Information</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Version and system information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Version</h4>
                <p className="text-gray-200">1.0.0</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Build</h4>
                <p className="text-gray-200">Development</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Current Theme</h4>
                <p className="text-gray-200 capitalize">{theme.replace('-', ' ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">User ID</h4>
                <p className="text-gray-200 font-mono text-sm">{user?.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Role</h4>
                <p className="text-gray-200 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    isWorker ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    isViewer ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {userRole || 'Unknown'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
