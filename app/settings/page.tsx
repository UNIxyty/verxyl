'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ThemePicker } from '@/components/ThemePicker'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { Cog6ToothIcon, PaintBrushIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
        <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Customize your Verxyl Ticket Management experience
          </p>
        </div>

        <div className="space-y-8">
          {/* New Webhook System */}
          <div className="card">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook System</h2>
                <p className="text-gray-400 text-sm">
                  Configure webhook notifications with domain and path settings
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-4">
                {/* Domain Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook Domain
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newWebhookDomain}
                      onChange={(e) => setNewWebhookDomain(e.target.value)}
                      placeholder="https://n8n.fluntstudios.com"
                      className="input flex-1"
                      disabled={isNewWebhookLoading || isNewWebhookSaving || !showDomainEdit}
                    />
                    <button
                      onClick={() => setShowDomainEdit(!showDomainEdit)}
                      className="btn-secondary whitespace-nowrap"
                    >
                      {showDomainEdit ? 'Cancel' : 'Change Domain'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    The base domain for your webhook endpoint
                  </p>
                </div>

                {/* Path Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tickets Webhook Path
                    </label>
                    <select
                      value={newWebhookPathTickets}
                      onChange={(e) => setNewWebhookPathTickets(e.target.value)}
                      className="input w-full"
                      disabled={isNewWebhookLoading || isNewWebhookSaving}
                    >
                      <option value="">Select path...</option>
                      <option value="/webhook/tickets">/webhook/tickets</option>
                      <option value="/api/tickets">/api/tickets</option>
                      <option value="/hooks/tickets">/hooks/tickets</option>
                    </select>
                    <p className="text-gray-400 text-xs mt-1">
                      Path for ticket-related events
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Users Webhook Path
                    </label>
                    <select
                      value={newWebhookPathUsers}
                      onChange={(e) => setNewWebhookPathUsers(e.target.value)}
                      className="input w-full"
                      disabled={isNewWebhookLoading || isNewWebhookSaving}
                    >
                      <option value="">Select path...</option>
                      <option value="/webhook/users">/webhook/users</option>
                      <option value="/api/users">/api/users</option>
                      <option value="/hooks/users">/hooks/users</option>
                    </select>
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

                <div className="flex justify-end">
                  <button
                    onClick={handleNewWebhookSave}
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                    className="btn-primary"
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


          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <PaintBrushIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Theme Settings</h2>
                <p className="text-gray-400 text-sm">
                  Choose your preferred color theme
                </p>
              </div>
            </div>

            <ThemePicker currentTheme={theme} onThemeChange={setTheme} />
          </div>

          {/* Application Info */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Cog6ToothIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Application Information</h2>
                <p className="text-gray-400 text-sm">
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
