'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
}

export default function PendingApprovalPage() {
  const { user, signOut } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/user-status')
        const data = await response.json()
        setUserData(data)
        
        if (data.approval_status === 'approved') {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-800 rounded-lg border border-dark-700">
        <div className="text-center">
          {userData.approval_status === 'rejected' ? (
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
          ) : (
            <ClockIcon className="mx-auto h-16 w-16 text-yellow-500" />
          )}
          
          <h2 className="mt-6 text-3xl font-bold text-white">
            {userData.approval_status === 'rejected' ? 'Access Denied' : 'Pending Approval'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-400">
            {userData.approval_status === 'rejected' 
              ? 'Your access request has been declined'
              : 'Your account is waiting for administrator approval'
            }
          </p>
        </div>

        <div className="bg-dark-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Account Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <p className="text-white">{userData.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <p className="text-white">{userData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                userData.approval_status === 'rejected' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userData.approval_status.charAt(0).toUpperCase() + userData.approval_status.slice(1)}
              </span>
            </div>
            {userData.rejection_reason && (
              <div>
                <label className="block text-sm font-medium text-gray-300">Reason</label>
                <p className="text-white">{userData.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={signOut}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {userData.approval_status === 'rejected' 
              ? 'Contact your administrator if you believe this is an error'
              : 'An administrator will review your request shortly'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
