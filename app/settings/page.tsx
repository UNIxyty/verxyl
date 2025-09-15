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
          const response = await fetch('/api/admin/webhook')
          if (response.ok) {
            const data = await response.json()
            setWebhookUrl(data.webhookUrl || '')
            setWebhookStatus(data.isConfigured ? 'configured' : 'not-configured')
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

  const handleWebhookSave = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL')
      return
    }

    setIsWebhookSaving(true)
    try {
      const response = await fetch('/api/admin/webhook', {
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

  const isAdmin = userRole === 'admin'


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
                    {webhookData?.usingFallback && (
                      <><br /><span className="text-yellow-200">⚠️ Currently using environment variable fallback - database table not found. Run the database setup script to enable full functionality.</span></>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              // Regular user notice
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> Webhook configuration is managed by system administrators. 
                  Contact your administrator to modify webhook settings.
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
