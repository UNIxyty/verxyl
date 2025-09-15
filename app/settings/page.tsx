'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ThemePicker } from '@/components/ThemePicker'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { Cog6ToothIcon, PaintBrushIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Notification types
type NotificationKey =
  | 'new_ticket'
  | 'updated_ticket'
  | 'deleted_ticket'
  | 'solved_ticket'
  | 'in_work_ticket'
  | 'shared_ai_backup'
  | 'shared_n8n_workflow'
  | 'new_mail'

type NotificationSettings = Record<NotificationKey, boolean>

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // New webhook settings
  const [newWebhookDomain, setNewWebhookDomain] = useState('')
  const [newWebhookPathTickets, setNewWebhookPathTickets] = useState('')
  const [newWebhookPathUsers, setNewWebhookPathUsers] = useState('')
  const [isNewWebhookLoading, setIsNewWebhookLoading] = useState(false)
  const [isNewWebhookSaving, setIsNewWebhookSaving] = useState(false)
  const [showDomainEdit, setShowDomainEdit] = useState(false)

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    new_ticket: true,
    updated_ticket: true,
    deleted_ticket: true,
    solved_ticket: true,
    in_work_ticket: true,
    shared_ai_backup: true,
    shared_n8n_workflow: true,
    new_mail: true
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


  // Load new webhook settings for admins
  useEffect(() => {
    const loadNewWebhookSettings = async () => {
      if (userRole === 'admin') {
        setIsNewWebhookLoading(true)
        try {
          const response = await fetch('/api/admin/new-webhook')
          if (response.ok) {
            const data = await response.json()
            setNewWebhookDomain(data.webhook_domain || '')
            setNewWebhookPathTickets(data.webhook_path_tickets || '')
            setNewWebhookPathUsers(data.webhook_path_users || '')
          } else {
            console.error('Failed to load new webhook settings')
          }
        } catch (error) {
          console.error('Error loading new webhook settings:', error)
        } finally {
          setIsNewWebhookLoading(false)
        }
      }
    }
    loadNewWebhookSettings()
  }, [userRole])

  // Load notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (user) {
        setIsNotificationLoading(true)
        try {
          const response = await fetch('/api/notification-settings')
          if (response.ok) {
            const data = await response.json()
            setNotificationSettings(data.settings)
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

  const handleNotificationSave = async () => {
    setIsNotificationSaving(true)
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings)
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

  const handleNewWebhookSave = async () => {
    if (!newWebhookDomain.trim()) {
      toast.error('Please enter a webhook domain')
      return
    }

    if (!newWebhookPathTickets.trim()) {
      toast.error('Please select a tickets webhook path')
      return
    }

    if (!newWebhookPathUsers.trim()) {
      toast.error('Please select a users webhook path')
      return
    }

    setIsNewWebhookSaving(true)
    try {
      const response = await fetch('/api/admin/new-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhook_domain: newWebhookDomain.trim(),
          webhook_path_tickets: newWebhookPathTickets.trim(),
          webhook_path_users: newWebhookPathUsers.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'New webhook settings saved successfully!')
        setShowDomainEdit(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save new webhook settings')
      }
    } catch (error) {
      console.error('Error saving new webhook settings:', error)
      toast.error('Failed to save new webhook settings')
    } finally {
      setIsNewWebhookSaving(false)
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
          {/* New Webhook System */}
          <div className="card">
            <div className="flex items-center mb-4 sm:mb-6">
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 mr-2 sm:mr-3" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Webhook System</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Configure webhook notifications with domain and path settings
                </p>
              </div>
            </div>

            {isAdmin ? (
            <div className="space-y-4">
              {/* Domain Section - Read-only with small change button */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook Domain
                </label>
                {showDomainEdit ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={newWebhookDomain}
                      onChange={(e) => setNewWebhookDomain(e.target.value)}
                      placeholder="https://n8n.fluntstudios.com"
                      className="input flex-1"
                      disabled={isNewWebhookLoading || isNewWebhookSaving}
                    />
                    <button
                      onClick={() => setShowDomainEdit(false)}
                      className="btn-secondary whitespace-nowrap btn-mobile"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-200 bg-gray-800 px-3 py-2 rounded border border-gray-600 flex-1 text-sm sm:text-base">
                      {newWebhookDomain || 'No domain configured'}
                    </span>
                    <button
                      onClick={() => setShowDomainEdit(true)}
                      className="btn-secondary text-sm btn-mobile"
                    >
                      change webhook domain
                    </button>
                  </div>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  The base domain for your webhook endpoint
                </p>
              </div>

              {/* Path Settings - Single column with 2 rows */}
              <div className="space-y-4">
                {/* Row 1: Tickets Path */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tickets path:
                  </label>
                <div className="flex flex-col sm:flex-row">
                  <span className="text-gray-300 bg-gray-800 px-3 py-2 rounded-t sm:rounded-l sm:rounded-t-lg border border-gray-600 sm:border-r-0 whitespace-nowrap text-sm sm:text-base">
                    {newWebhookDomain || 'https://example.com'}
                  </span>
                  <input
                    type="text"
                    value={newWebhookPathTickets}
                    onChange={(e) => setNewWebhookPathTickets(e.target.value)}
                    placeholder="/webhook/tickets"
                    className="input rounded-b sm:rounded-l-none sm:rounded-r border-t-0 sm:border-t sm:border-l-0 flex-1"
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                  />
                </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Path for ticket-related events
                  </p>
                </div>

                {/* Row 2: Users Path */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Users path:
                  </label>
                <div className="flex flex-col sm:flex-row">
                  <span className="text-gray-300 bg-gray-800 px-3 py-2 rounded-t sm:rounded-l sm:rounded-t-lg border border-gray-600 sm:border-r-0 whitespace-nowrap text-sm sm:text-base">
                    {newWebhookDomain || 'https://example.com'}
                  </span>
                  <input
                    type="text"
                    value={newWebhookPathUsers}
                    onChange={(e) => setNewWebhookPathUsers(e.target.value)}
                    placeholder="/webhook/users"
                    className="input rounded-b sm:rounded-l-none sm:rounded-r border-t-0 sm:border-t sm:border-l-0 flex-1"
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                  />
                </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Path for user-related events
                  </p>
                </div>
              </div>

                {/* Preview */}
                {newWebhookDomain && (newWebhookPathTickets || newWebhookPathUsers) && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-200 text-sm">
                      <strong>Webhook URLs:</strong><br />
                      {newWebhookPathTickets && (
                        <>Tickets: <code className="text-blue-100">{newWebhookDomain}{newWebhookPathTickets}</code><br /></>
                      )}
                      {newWebhookPathUsers && (
                        <>Users: <code className="text-blue-100">{newWebhookDomain}{newWebhookPathUsers}</code></>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end">
                  <button
                    onClick={handleNewWebhookSave}
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                    className="btn-primary btn-mobile"
                  >
                    {isNewWebhookSaving ? 'Saving...' : 'Save & Test'}
                  </button>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-200 text-sm">
                    <strong>Webhook System Features:</strong><br />
                    • Separate domain and path configuration<br />
                    • Different endpoints for tickets and users<br />
                    • Enhanced payload with detailed information<br />
                    • Automatic testing on save
                  </p>
                </div>
              </div>
            ) : (
              // Non-admin user notice
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> Webhook configuration is managed by system administrators. 
                  Contact your administrator to modify these settings.
                </p>
              </div>
            )}
          </div>


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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'new_ticket', label: 'New Ticket', description: 'When a new ticket is created' },
                    { key: 'updated_ticket', label: 'Updated Ticket', description: 'When a ticket is updated' },
                    { key: 'deleted_ticket', label: 'Deleted Ticket', description: 'When a ticket is deleted' },
                    { key: 'solved_ticket', label: 'Solved Ticket', description: 'When a ticket is marked as solved' },
                    { key: 'in_work_ticket', label: 'In Work Ticket', description: 'When work starts on a ticket' },
                    { key: 'shared_ai_backup', label: 'Shared AI Backup', description: 'When an AI backup is shared with you' },
                    { key: 'shared_n8n_workflow', label: 'Shared N8N Workflow', description: 'When an N8N workflow is shared with you' },
                    { key: 'new_mail', label: 'New Mail', description: 'When you receive a new internal mail' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-200">
                          {setting.label}
                        </label>
                        <p className="text-xs text-gray-400 mt-1">
                          {setting.description}
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        <input
                          type="checkbox"
                          checked={notificationSettings[setting.key as NotificationKey]}
                          onChange={(e) => handleNotificationChange(setting.key as NotificationKey, e.target.checked)}
                          disabled={isNotificationSaving}
                          className="w-4 h-4 text-primary-600 bg-dark-600 border-gray-500 rounded focus:ring-primary-500 focus:ring-2"
                        />
                      </div>
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
