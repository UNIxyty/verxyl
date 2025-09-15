'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { 
  InboxIcon, 
  PaperAirplaneIcon, 
  PlusIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Modal } from '@/components/Modal'
import { UserSelector } from '@/components/UserSelector'
import { UserProfileModal } from '@/components/UserProfileModal'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Mail {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  is_read: boolean
  mail_type: string
  related_id: string | null
  related_type: string | null
  created_at: string
  read_at: string | null
  sender: User
  recipient: User
}

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  onSent: () => void
}

function ComposeModal({ isOpen, onClose, onSent }: ComposeModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  })

  const handleSend = async () => {
    if (!formData.recipient_id || !formData.subject || !formData.content) {
      toast.error('Please fill in all fields')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Mail sent successfully!')
        setFormData({ recipient_id: '', subject: '', content: '' })
        onSent()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to send mail')
      }
    } catch (error) {
      console.error('Error sending mail:', error)
      toast.error('Failed to send mail')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Mail" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            To:
          </label>
          <UserSelector
            value={formData.recipient_id}
            onChange={(value) => setFormData({ ...formData, recipient_id: value as string })}
            placeholder="Select recipient..."
            disabled={sending}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject:
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="input w-full"
            placeholder="Enter subject..."
            disabled={sending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message:
          </label>
          <textarea
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="textarea w-full"
            placeholder="Type your message..."
            disabled={sending}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-mobile"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="btn-primary btn-mobile"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Mail'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

interface MailViewModalProps {
  isOpen: boolean
  onClose: () => void
  mail: Mail | null
  onUserClick: (user: User) => void
}

function MailViewModal({ isOpen, onClose, mail, onUserClick }: MailViewModalProps) {
  const { user: currentUser } = useAuth()

  if (!mail) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isReceived = currentUser?.id === mail.recipient_id

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mail Details" size="lg">
      <div className="space-y-4">
        {/* Mail Header */}
        <div className="border-b border-gray-700 pb-4">
          <h3 className="text-lg font-semibold text-white mb-2">{mail.subject}</h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">From:</span>
              <button
                onClick={() => onUserClick(mail.sender)}
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <UserIcon className="h-4 w-4" />
                {mail.sender.full_name || mail.sender.email} ({mail.sender.role})
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">To:</span>
              <button
                onClick={() => onUserClick(mail.recipient)}
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <UserIcon className="h-4 w-4" />
                {mail.recipient.full_name || mail.recipient.email} ({mail.recipient.role})
              </button>
            </div>
            
            <div>
              <span className="font-medium">Sent:</span> {formatDate(mail.created_at)}
            </div>
          </div>

          {mail.mail_type !== 'message' && (
            <div className="mt-2">
              <span className="badge badge-low">
                {mail.mail_type.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Mail Content */}
        <div className="bg-dark-700 rounded-lg p-4">
          <p className="text-gray-200 whitespace-pre-wrap">{mail.content}</p>
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

export default function InboxPage() {
  const { user } = useAuth()
  const [mails, setMails] = useState<Mail[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadMails()
    }
  }, [user, activeTab])

  const loadMails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mails?type=${activeTab}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setMails(data.mails || [])
        
        // Count unread mails in inbox
        if (activeTab === 'inbox') {
          const unread = data.mails?.filter((mail: Mail) => !mail.is_read).length || 0
          setUnreadCount(unread)
        }
      } else {
        toast.error('Failed to load mails')
      }
    } catch (error) {
      console.error('Error loading mails:', error)
      toast.error('Failed to load mails')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (mailId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/mails/${mailId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: isRead })
      })

      if (response.ok) {
        // Update local state
        setMails(mails.map(mail => 
          mail.id === mailId 
            ? { ...mail, is_read: isRead, read_at: isRead ? new Date().toISOString() : null }
            : mail
        ))
        
        // Update unread count
        if (activeTab === 'inbox') {
          setUnreadCount(prev => isRead ? prev - 1 : prev + 1)
        }
      }
    } catch (error) {
      console.error('Error updating mail read status:', error)
      toast.error('Failed to update mail')
    }
  }

  const handleMailClick = async (mail: Mail) => {
    // Mark as read if it's an unread received mail
    if (!mail.is_read && mail.recipient_id === user?.id) {
      await markAsRead(mail.id, true)
    }
    
    setSelectedMail(mail)
    setIsViewModalOpen(true)
  }

  const handleUserClick = (clickedUser: User) => {
    setSelectedUserId(clickedUser.id)
    setIsUserProfileOpen(true)
  }

  const handleSendMailToUser = (userId: string) => {
    setIsUserProfileOpen(false)
    setIsComposeOpen(true)
    // Pre-select the user in compose modal
    // This would need to be passed to the compose modal
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Inbox</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage your internal communications
            </p>
          </div>
          
          <button
            onClick={() => setIsComposeOpen(true)}
            className="btn-primary flex items-center btn-mobile"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Compose Mail
          </button>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`py-2 px-1 border-b-2 font-medium text-sm text-left sm:text-center flex items-center gap-2 ${
                  activeTab === 'inbox'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <InboxIcon className="h-4 w-4" />
                Inbox {unreadCount > 0 && activeTab === 'inbox' && (
                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm text-left sm:text-center flex items-center gap-2 ${
                  activeTab === 'sent'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Sent
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {mails.length === 0 ? (
              <div className="text-center py-12">
                <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  No {activeTab === 'inbox' ? 'received' : 'sent'} mails found
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mails.map((mail) => {
                  const isReceived = activeTab === 'inbox'
                  const otherUser = isReceived ? mail.sender : mail.recipient
                  
                  return (
                    <div
                      key={mail.id}
                      onClick={() => handleMailClick(mail)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        mail.is_read || activeTab === 'sent'
                          ? 'bg-dark-800 border-dark-600 hover:bg-dark-700'
                          : 'bg-dark-700 border-primary-500/30 hover:bg-dark-600'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {!mail.is_read && activeTab === 'inbox' && (
                              <EnvelopeIcon className="h-4 w-4 text-primary-400 flex-shrink-0" />
                            )}
                            {mail.is_read && activeTab === 'inbox' && (
                              <EnvelopeOpenIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            
                            <h3 className={`font-medium truncate ${
                              mail.is_read || activeTab === 'sent' ? 'text-gray-200' : 'text-white'
                            }`}>
                              {mail.subject}
                            </h3>
                            
                            {mail.mail_type !== 'message' && (
                              <span className="badge badge-low text-xs">
                                {mail.mail_type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <span className="truncate">
                                {otherUser.full_name || otherUser.email} ({otherUser.role})
                              </span>
                            </div>
                            <div className="text-xs">
                              {formatDate(mail.created_at)}
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm mt-1 truncate">
                            {mail.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <EyeIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onSent={loadMails}
        />

        <MailViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          mail={selectedMail}
          onUserClick={handleUserClick}
        />

        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          userId={selectedUserId}
          onSendMail={handleSendMailToUser}
        />
      </div>
    </DashboardLayout>
  )
}
