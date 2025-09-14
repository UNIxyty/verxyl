'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ThemePicker } from '@/components/ThemePicker'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/lib/language-context'
import { useEffect, useState } from 'react'
import { Cog6ToothIcon, LinkIcon, PaintBrushIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Settings {
  webhookUrl: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [settings, setSettings] = useState<Settings>({
    webhookUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Load settings from localStorage for now
      // In a real app, this would come from the database
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      // Save to localStorage for now
      // In a real app, this would save to the database
      localStorage.setItem('userSettings', JSON.stringify(settings))
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleWebhookChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      webhookUrl: value
    }))
  }

  const testWebhook = async () => {
    if (!settings.webhookUrl) {
      toast.error('Please enter a webhook URL first')
      return
    }

    try {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'This is a test webhook from Verxyl Ticket Management',
          timestamp: new Date().toISOString(),
          user: user?.email
        })
      })

      if (response.ok) {
        toast.success('Webhook test successful!')
      } else {
        toast.error('Webhook test failed. Check your URL and try again.')
      }
    } catch (error) {
      console.error('Webhook test error:', error)
      toast.error('Webhook test failed. Check your URL and try again.')
    }
  }

  const validateWebhookUrl = (url: string) => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('settingsTitle')}</h1>
          <p className="text-gray-400">
            Customize your Verxyl Ticket Management experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Webhook Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <LinkIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook Configuration</h2>
                <p className="text-gray-400 text-sm">
                  Configure webhook URLs for ticket notifications and automation
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => handleWebhookChange(e.target.value)}
                    placeholder="https://your-webhook-url.com/endpoint"
                    className="flex-1 input"
                  />
                  <button
                    onClick={testWebhook}
                    disabled={!settings.webhookUrl || !validateWebhookUrl(settings.webhookUrl)}
                    className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test
                  </button>
                </div>
                {settings.webhookUrl && !validateWebhookUrl(settings.webhookUrl) && (
                  <p className="mt-2 text-sm text-red-400">
                    Please enter a valid URL starting with http:// or https://
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  This webhook will be called when tickets are created, updated, or completed.
                  The payload will include ticket details and user information.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Webhook Settings'}
                </button>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <GlobeAltIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">{t('language')}</h2>
                <p className="text-gray-400 text-sm">
                  {t('languageDescription')}
                </p>
              </div>
            </div>

            <LanguageSelector />
          </div>

          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <PaintBrushIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">{t('theme')}</h2>
                <p className="text-gray-400 text-sm">
                  {t('themeDescription')}
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
