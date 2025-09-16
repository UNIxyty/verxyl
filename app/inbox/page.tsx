'use client'

import { useAuth } from '@/components/AuthProvider'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Modal } from '@/components/Modal'
import { UserSelector } from '@/components/UserSelector'
import { UserProfileModal } from '@/components/UserProfileModal'
import GmailInbox from '@/components/GmailInbox'
import { UserIcon } from '@heroicons/react/24/outline'

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
  replyTo?: Mail | null
}

function ComposeModal({ isOpen, onClose, onSent, replyTo }: ComposeModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  })

  // Initialize form data when replyTo changes
  useEffect(() => {
    if (replyTo) {
      setFormData({
        recipient_id: replyTo.sender_id,
        subject: replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`,
        content: `\n\n--- Original Message ---\nFrom: ${replyTo.sender.full_name || replyTo.sender.email}\nDate: ${new Date(replyTo.created_at).toLocaleString()}\n\n${replyTo.content}\n`
      })
    } else {
      setFormData({
        recipient_id: '',
        subject: '',
        content: ''
      })
    }
  }, [replyTo])

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
  onReply?: (mail: Mail) => void
}

function MailViewModal({ isOpen, onClose, mail, onUserClick, onReply }: MailViewModalProps) {
  const { user: currentUser } = useAuth()
  const [isReplying, setIsReplying] = useState(false)

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
  const canReply = isReceived && !mail.is_draft

  const handleReply = () => {
    if (mail && onReply) {
      onClose()
      onReply(mail)
    }
  }

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

        <div className="flex justify-between">
          <div>
            {canReply && (
              <button
                onClick={handleReply}
                className="btn-primary mr-3"
              >
                Reply
              </button>
            )}
          </div>
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
  const router = useRouter()
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
  const [replyToMail, setReplyToMail] = useState<Mail | null>(null)

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

  const handleViewMail = (mail: Mail) => {
    setSelectedMail(mail)
    setIsViewModalOpen(true)
  }

  const handleReply = (mail: Mail) => {
    setReplyToMail(mail)
    setIsComposeOpen(true)
  }

  return (
    <DashboardLayout>
      <GmailInbox
        onCompose={() => setIsComposeOpen(true)}
        onViewMail={handleViewMail}
        onUserClick={handleUserClick}
      />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false)
          setReplyToMail(null)
        }}
        onSent={() => {
          window.location.reload()
          setReplyToMail(null)
        }}
        replyTo={replyToMail}
      />

      <MailViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        mail={selectedMail}
        onUserClick={handleUserClick}
        onReply={handleReply}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        userId={selectedUserId}
        onSendMail={handleSendMailToUser}
      />
    </DashboardLayout>
  )
}
