'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { ThemePicker } from '@/components/ThemePicker'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { Cog6ToothIcon, PaintBrushIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()


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
          {/* Webhook Notice */}
          <div className="card">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook Configuration</h2>
                <p className="text-gray-400 text-sm">
                  Webhook URL is configured via environment variables
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Note:</strong> Webhook URL is configured via the <code className="bg-blue-800/30 px-1 rounded">WEBHOOK_URL</code> environment variable. 
                Contact your administrator to modify webhook settings.
              </p>
            </div>
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
