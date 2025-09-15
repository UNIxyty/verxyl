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
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isWebhookLoading, setIsWebhookLoading] = useState(false)
  const [isWebhookSaving, setIsWebhookSaving] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<'configured' | 'not-configured' | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  
  // New webhook settings
  const [newWebhookDomain, setNewWebhookDomain] = useState('')
  const [newWebhookPath, setNewWebhookPath] = useState('')
  const [isNewWebhookLoading, setIsNewWebhookLoading] = useState(false)
  const [isNewWebhookSaving, setIsNewWebhookSaving] = useState(false)

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

  // Load webhook settings for admins
  useEffect(() => {
    const loadWebhookSettings = async () => {
      if (userRole === 'admin') {
        setIsWebhookLoading(true)
        try {
          const response = await fetch('/api/webhook-fallback')
          if (response.ok) {
            const data = await response.json()
            setWebhookUrl(data.webhookUrl || '')
            setWebhookStatus(data.isConfigured ? 'configured' : 'not-configured')
            setUsingFallback(!data.usingDatabase)
          } else {
            console.error('Failed to load webhook settings')
          }
        } catch (error) {
          console.error('Error loading webhook settings:', error)
        } finally {
          setIsWebhookLoading(false)
        }
      }
    }
    loadWebhookSettings()
  }, [userRole])

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
            setNewWebhookPath(data.webhook_path || '')
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

  const handleWebhookSave = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL')
      return
    }

    setIsWebhookSaving(true)
    try {
      const response = await fetch('/api/webhook-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Webhook URL validated successfully!')
        setWebhookStatus('configured')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save webhook URL')
      }
    } catch (error) {
      console.error('Error saving webhook:', error)
      toast.error('Failed to save webhook URL')
    } finally {
      setIsWebhookSaving(false)
    }
  }

  const handleNewWebhookSave = async () => {
    if (!newWebhookDomain.trim()) {
      toast.error('Please enter a webhook domain')
      return
    }

    if (!newWebhookPath.trim()) {
      toast.error('Please enter a webhook path')
      return
    }

    setIsNewWebhookSaving(true)
    try {
      const response = await fetch('/api/admin/new-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhook_domain: newWebhookDomain.trim(),
          webhook_path: newWebhookPath.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'New webhook settings saved successfully!')
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
          {/* Webhook Configuration */}
          <div className="card">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook Configuration</h2>
                <p className="text-gray-400 text-sm">
                  {isAdmin ? 'Configure webhook URL for ticket notifications' : 'Webhook URL is configured via environment variables'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              // Admin webhook editing interface
              <div className="space-y-4">
                <div>
                  <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="url"
                      id="webhook-url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-webhook-endpoint.com/webhook"
                      className="input flex-1"
                      disabled={isWebhookLoading || isWebhookSaving}
                    />
                    <button
                      onClick={handleWebhookSave}
                      disabled={isWebhookLoading || isWebhookSaving}
                      className="btn-primary whitespace-nowrap"
                    >
                      {isWebhookSaving ? 'Testing...' : 'Test & Save'}
                    </button>
                  </div>
                </div>

                {webhookStatus && (
                  <div className="flex items-center space-x-2">
                    {webhookStatus === 'configured' ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        <span className="text-green-400 text-sm">Webhook is configured and working</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-400" />
                        <span className="text-red-400 text-sm">Webhook is not configured</span>
                      </>
                    )}
                  </div>
                )}

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-200 text-sm">
                    <strong>Note:</strong> Webhook URL is now stored in the database and can be managed directly from this interface. 
                    Changes are saved immediately and will be used for all future webhook notifications.
                    {usingFallback && (
                      <><br /><span className="text-yellow-200">⚠️ Currently using environment variable fallback - database table not found. Run the database setup script to enable full functionality.</span></>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              // Non-admin user notice
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> Webhook configuration is managed by system administrators. 
                  Contact your administrator to modify webhook settings.
                  {isViewer && (
                    <><br /><span className="text-yellow-200">⚠️ As a viewer, you have limited access to system settings.</span></>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* New Webhook Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">New Webhook System</h2>
                <p className="text-gray-400 text-sm">
                  Configure the new webhook system with domain and path settings
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook Domain
                  </label>
                  <input
                    type="url"
                    value={newWebhookDomain}
                    onChange={(e) => setNewWebhookDomain(e.target.value)}
                    placeholder="https://n8n.fluntstudios.com"
                    className="input w-full"
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    The base domain for your webhook endpoint (e.g., https://n8n.fluntstudios.com)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook Path
                  </label>
                  <input
                    type="text"
                    value={newWebhookPath}
                    onChange={(e) => setNewWebhookPath(e.target.value)}
                    placeholder="/webhook/path"
                    className="input w-full"
                    disabled={isNewWebhookLoading || isNewWebhookSaving}
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    The path to your webhook endpoint (e.g., /webhook/verxyl-tickets)
                  </p>
                </div>

                {newWebhookDomain && newWebhookPath && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-200 text-sm">
                      <strong>Full Webhook URL:</strong><br />
                      <code className="text-blue-100">{newWebhookDomain}{newWebhookPath}</code>
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
                    <strong>New Webhook System Features:</strong><br />
                    • Separate domain and path configuration<br />
                    • Enhanced payload with detailed role change information<br />
                    • Better error handling and logging<br />
                    • Automatic testing on save
                  </p>
                </div>
              </div>
            ) : (
              // Non-admin user notice
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> New webhook configuration is managed by system administrators. 
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
