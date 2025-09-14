'use client'

import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { DashboardLayout } from '@/components/DashboardLayout'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  role: 'user' | 'admin'
}

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' })
      })
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, approval_status: 'approved' as const }
            : u
        ))
      }
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  const handleRejectUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject', reason })
      })
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, approval_status: 'rejected' as const }
            : u
        ))
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  const pendingUsers = users.filter(u => u.approval_status === 'pending')
  const approvedUsers = users.filter(u => u.approval_status === 'approved')
  const rejectedUsers = users.filter(u => u.approval_status === 'rejected')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Manage user access and approvals</p>
        </div>

        {/* Pending Users */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Pending Approvals ({pendingUsers.length})
          </h2>
          
          {pendingUsers.length === 0 ? (
            <p className="text-gray-400">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-dark-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name || ''} className="h-10 w-10 rounded-full" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <p className="text-gray-500 text-xs">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):')
                        if (reason !== null) {
                          handleRejectUser(user.id, reason)
                        }
                      }}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Users */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Approved Users ({approvedUsers.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedUsers.map((user) => (
              <div key={user.id} className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || ''} className="h-8 w-8 rounded-full" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{user.full_name || 'No name'}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rejected Users */}
        {rejectedUsers.length > 0 && (
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Rejected Users ({rejectedUsers.length})
            </h2>
            
            <div className="space-y-2">
              {rejectedUsers.map((user) => (
                <div key={user.id} className="bg-dark-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{user.full_name || 'No name'}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                  <span className="text-red-400 text-xs">Rejected</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
