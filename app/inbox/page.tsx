'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { DashboardLayout } from '@/components/DashboardLayout'
import { UserIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/Modal'

interface Message {
  id: string
  subject: string
  content: string
  sender_id: string
  recipient_id: string
  created_at: string
  read_at: string | null
  sender: {
    id: string
    email: string
    full_name: string | null
  }
  recipient: {
    id: string
    email: string
    full_name: string | null
  }
}

interface MessageViewModalProps {
  isOpen: boolean
  onClose: () => void
  message: Message | null
  onUserClick: (userId: string) => void
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

export default function InboxPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchMessages()
  }, [user, router])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message)
    setIsViewModalOpen(true)
    
    // Mark as read if not already read
    if (!message.read_at) {
      markAsRead(message.id)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH'
      })
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
      ))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsUserProfileOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your messages...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <UserIcon className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Messages</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchMessages}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-gray-400">Messages sent to you by other users</p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No messages yet</h3>
            <p className="text-gray-400">You haven't received any messages from other users.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages
              .filter(message => message.recipient_id === user?.id)
              .map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleViewMessage(message)}
                  className="bg-dark-800 hover:bg-dark-700 rounded-lg p-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUserClick(message.sender_id)
                          }}
                          className="font-medium text-white hover:text-primary-400 transition-colors"
                        >
                          {message.sender.full_name || message.sender.email}
                        </button>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-400">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{message.subject}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {message.content.substring(0, 100)}
                        {message.content.length > 100 && '...'}
                      </p>
                    </div>
                    {!message.read_at && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full ml-4"></div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <MessageViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        message={selectedMessage}
        onUserClick={handleUserClick}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        userId={selectedUserId}
      />
    </DashboardLayout>
  )
}

function MessageViewModal({ isOpen, onClose, message, onUserClick }: MessageViewModalProps) {
  if (!message) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Details" size="lg">
      <div className="space-y-4">
        <div className="border-b border-dark-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => onUserClick(message.sender_id)}
              className="font-medium text-white hover:text-primary-400 transition-colors"
            >
              {message.sender.full_name || message.sender.email}
            </button>
            <span className="text-sm text-gray-400">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white">{message.subject}</h2>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 whitespace-pre-wrap">{message.content}</div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser()
    }
  }, [isOpen, userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading user profile...</p>
          </div>
        ) : user ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white">{user.full_name || 'Unknown User'}</h3>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-400">Role:</span>
                <span className="ml-2 text-sm text-white capitalize">{user.role}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400">Status:</span>
                <span className="ml-2 text-sm text-white capitalize">{user.approval_status}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400">Joined:</span>
                <span className="ml-2 text-sm text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">User not found</p>
          </div>
        )}
      </div>
    </Modal>
  )
}