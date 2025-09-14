'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { getUserById, updateUser } from '@/lib/database'
import { UserIcon, CameraIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  telegram_username: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    telegram_username: '',
  })

  useEffect(() => {
    if (authUser) {
      loadUserProfile()
    }
  }, [authUser])

  const loadUserProfile = async () => {
    if (!authUser) return

    try {
      const userData = await getUserById(authUser.id)
      if (userData) {
        setUser(userData)
        setFormData({
          username: userData.username || '',
          telegram_username: userData.telegram_username || '',
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Only update username, not telegram_username if it's already connected
      const updateData: any = {
        username: formData.username || null,
      }
      
      // Only update telegram_username if it's not already connected
      if (!user.telegram_username) {
        updateData.telegram_username = formData.telegram_username || null
      }

      const updatedUser = await updateUser(user.id, updateData)

      if (updatedUser) {
        setUser(updatedUser)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectTelegram = () => {
    // Redirect to Telegram bot
    window.open('https://t.me/verxyl_bot', '_blank')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="card">
                <div className="h-32 bg-dark-700 rounded-full w-32 mx-auto mb-4"></div>
                <div className="h-6 bg-dark-700 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="card space-y-4">
                <div className="h-4 bg-dark-700 rounded w-1/4"></div>
                <div className="h-10 bg-dark-700 rounded w-full"></div>
                <div className="h-4 bg-dark-700 rounded w-1/4"></div>
                <div className="h-10 bg-dark-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture and Basic Info */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              <div className="relative inline-block mb-4">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="h-32 w-32 rounded-full mx-auto object-cover"
                  />
                ) : authUser?.user_metadata?.avatar_url ? (
                  <img
                    src={authUser.user_metadata.avatar_url}
                    alt="Profile"
                    className="h-32 w-32 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-primary-600 flex items-center justify-center mx-auto">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 bg-dark-700 hover:bg-dark-600 text-white p-2 rounded-full border-2 border-dark-600 transition-colors">
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-1">
                {user?.username || user?.full_name || authUser?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-gray-400 mb-4">{user?.email || authUser?.email}</p>
              
              <div className="space-y-2 text-sm text-gray-400">
                <p><span className="font-medium">Member since:</span> {user && formatDate(user.created_at)}</p>
                <p><span className="font-medium">Last updated:</span> {user && formatDate(user.updated_at)}</p>
              </div>
            </div>

            {/* Telegram Connection */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Telegram Integration</h3>
              {user?.telegram_username ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-green-300 font-medium">Connected</p>
                        <p className="text-green-400 text-sm">@{user.telegram_username}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    You can receive ticket notifications and updates via Telegram
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleConnectTelegram}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16l-1.61 7.59c-.121.537-.44.671-.89.416l-2.46-1.815-1.186 1.143c-.131.131-.241.241-.494.241l.176-2.509 4.588-4.144c.2-.178-.044-.277-.31-.1l-5.676 3.573-2.45-.765c-.534-.166-.547-.534.11-.79l9.574-3.693c.445-.166.834.1.69.79z"/>
                    </svg>
                    Connect Telegram
                  </button>
                  <p className="text-xs text-gray-400">
                    Connect your Telegram account to receive notifications
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || authUser?.email || ''}
                    disabled
                    className="input w-full bg-dark-800 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed. It's managed by your Google account.
                  </p>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={user?.full_name || authUser?.user_metadata?.full_name || ''}
                    disabled
                    className="input w-full bg-dark-800 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Full name is managed by your Google account.
                  </p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="Enter your preferred username"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be displayed in tickets and comments.
                  </p>
                </div>

                <div>
                  <label htmlFor="telegram_username" className="block text-sm font-medium text-gray-300 mb-2">
                    Telegram Username
                  </label>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        id="telegram_username"
                        name="telegram_username"
                        value={formData.telegram_username}
                        onChange={handleInputChange}
                        disabled={!!user?.telegram_username}
                        className={`input w-full ${user?.telegram_username ? 'bg-dark-800 text-gray-500 cursor-not-allowed' : ''}`}
                        placeholder="Enter your Telegram username (without @)"
                      />
                    </div>
                    <button
                      onClick={handleConnectTelegram}
                      className="btn-secondary whitespace-nowrap"
                    >
                      {user?.telegram_username ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {user?.telegram_username 
                      ? 'Telegram username is managed by the bot connection and cannot be changed manually.'
                      : 'Enter your Telegram username to receive notifications.'
                    }
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
