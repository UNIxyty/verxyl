'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  EnvelopeIcon, 
  PaperAirplaneIcon, 
  DocumentDuplicateIcon,
  StarIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  ArrowLeftIcon,
  UserIcon,
  XMarkIcon,
  TagIcon,
  PaperClipIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Mail {
  id: string
  subject: string
  content: string
  sender_id: string
  recipient_id: string
  is_read: boolean
  is_draft: boolean
  is_starred?: boolean
  is_important?: boolean
  is_spam?: boolean
  is_trash?: boolean
  labels?: string[]
  created_at: string
  read_at?: string
  sender?: User
  recipient?: User
}

interface GmailInboxProps {
  onCompose: () => void
  onViewMail: (mail: Mail) => void
  onUserClick: (user: User) => void
}

const FOLDER_ICONS = {
  inbox: EnvelopeIcon,
  sent: PaperAirplaneIcon,
  drafts: DocumentDuplicateIcon,
  starred: StarIcon,
  important: ExclamationTriangleIcon,
  spam: ExclamationTriangleIcon,
  trash: TrashIcon
}

const FOLDER_COUNTS = {
  inbox: 0,
  sent: 0,
  drafts: 0,
  starred: 0,
  important: 0,
  spam: 0,
  trash: 0
}

export default function GmailInbox({ onCompose, onViewMail, onUserClick }: GmailInboxProps) {
  const router = useRouter()
  const [mails, setMails] = useState<Mail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMails, setSelectedMails] = useState<string[]>([])
  const [folderCounts, setFolderCounts] = useState(FOLDER_COUNTS)
  const [showLabels, setShowLabels] = useState(false)
  const [labels, setLabels] = useState<any[]>([])
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    content: ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('inbox')

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: FOLDER_ICONS.inbox },
    { id: 'sent', name: 'Sent', icon: FOLDER_ICONS.sent },
    { id: 'drafts', name: 'Drafts', icon: FOLDER_ICONS.drafts },
    { id: 'starred', name: 'Starred', icon: FOLDER_ICONS.starred },
    { id: 'important', name: 'Important', icon: FOLDER_ICONS.important },
    { id: 'spam', name: 'Spam', icon: FOLDER_ICONS.spam },
    { id: 'trash', name: 'Trash', icon: FOLDER_ICONS.trash }
  ]

  useEffect(() => {
    loadMails()
    loadLabels()
  }, [selectedFolder, searchQuery])

  const loadMails = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: selectedFolder,
        limit: '50',
        offset: '0'
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/mails?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMails(data.mails || [])
        
        // Update folder counts
        const counts = { ...FOLDER_COUNTS }
        if (data.mails) {
          counts[selectedFolder as keyof typeof counts] = data.mails.length
        }
        setFolderCounts(counts)
      }
    } catch (error) {
      console.error('Error loading mails:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLabels = async () => {
    try {
      const response = await fetch('/api/mail-labels')
      if (response.ok) {
        const data = await response.json()
        setLabels(data.labels || [])
      }
    } catch (error) {
      console.error('Error loading labels:', error)
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
        setMails(mails.map(mail => 
          mail.id === mailId ? { ...mail, is_read: isRead } : mail
        ))
      }
    } catch (error) {
      console.error('Error marking mail as read:', error)
    }
  }

  const toggleStar = async (mailId: string, isStarred: boolean) => {
    try {
      const response = await fetch(`/api/mails/${mailId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !isStarred })
      })

      if (response.ok) {
        setMails(mails.map(mail => 
          mail.id === mailId ? { ...mail, is_starred: !isStarred } : mail
        ))
        
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail({ ...selectedMail, is_starred: !isStarred })
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const toggleImportant = async (mailId: string, isImportant: boolean) => {
    try {
      const response = await fetch(`/api/mails/${mailId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_important: !isImportant })
      })

      if (response.ok) {
        setMails(mails.map(mail => 
          mail.id === mailId ? { ...mail, is_important: !isImportant } : mail
        ))
        
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail({ ...selectedMail, is_important: !isImportant })
        }
      }
    } catch (error) {
      console.error('Error toggling important:', error)
    }
  }

  const handleMailClick = async (mail: Mail) => {
    if (!mail.is_read) {
      await markAsRead(mail.id, true)
    }
    setSelectedMail(mail)
    onViewMail(mail)
  }

  const handleBackToInbox = () => {
    setSelectedMail(null)
    setIsFullscreen(false)
  }

  const updateMailProperty = async (mailId: string, property: string, value: any) => {
    try {
      const response = await fetch(`/api/mails/${mailId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [property]: value })
      })

      if (response.ok) {
        setMails(mails.map(mail => 
          mail.id === mailId 
            ? { ...mail, [property]: value }
            : mail
        ))
        
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail({ ...selectedMail, [property]: value })
        }
      }
    } catch (error) {
      console.error('Error updating mail property:', error)
    }
  }

  const handleSpam = (mailId: string) => {
    updateMailProperty(mailId, 'is_spam', true)
  }

  const handleDelete = (mailId: string) => {
    updateMailProperty(mailId, 'is_trash', true)
  }

  const createTag = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/mail-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      })

      if (response.ok) {
        const data = await response.json()
        setLabels([...labels, data.label])
        return data.label
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const addTagToMail = async (mailId: string, tagName: string) => {
    try {
      let tag = labels.find(l => l.name === tagName)
      if (!tag) {
        tag = await createTag(tagName, '#3B82F6')
      }

      const mail = mails.find(m => m.id === mailId)
      const currentLabels = mail?.labels || []
      
      if (!currentLabels.includes(tagName)) {
        const newLabels = [...currentLabels, tagName]
        updateMailProperty(mailId, 'labels', newLabels)
      }
    } catch (error) {
      console.error('Error adding tag to mail:', error)
    }
  }

  const uploadFile = async (file: File) => {
    if (!selectedMail) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mailId', selectedMail.id)

      const response = await fetch('/api/mails/attachments', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setAttachments([...attachments, data.attachment])
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const sendEmail = async () => {
    try {
      const recipientResponse = await fetch(`/api/users/search?email=${encodeURIComponent(composeData.recipient)}`)
      if (!recipientResponse.ok) {
        alert('Recipient not found')
        return
      }
      
      const recipientData = await recipientResponse.json()
      const recipient = recipientData.user

      const response = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: recipient.id,
          subject: composeData.subject,
          content: composeData.content
        })
      })

      if (response.ok) {
        setShowCompose(false)
        setComposeData({ recipient: '', subject: '', content: '' })
        window.location.reload()
        alert('Email sent successfully!')
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error sending email')
    }
  }

  const saveDraft = async () => {
    try {
      const response = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeData.subject,
          content: composeData.content,
          is_draft: true
        })
      })

      if (response.ok) {
        setShowCompose(false)
        setComposeData({ recipient: '', subject: '', content: '' })
        window.location.reload()
        alert('Draft saved!')
      } else {
        alert('Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Error saving draft')
    }
  }

  const getSenderName = (mail: Mail) => {
    if (mail.sender?.full_name) return mail.sender.full_name
    return mail.sender?.email || 'Unknown'
  }

  const getSenderRole = (mail: Mail) => {
    return mail.sender?.role || 'user'
  }

  return (
    <div className="flex h-screen bg-dark-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 btn-primary rounded-lg"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Back to Dashboard Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 btn-secondary rounded-lg"
        title="Back to Dashboard"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-700 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Compose
          </button>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2">
            {folders.map((folder) => {
              const Icon = folder.icon
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{folder.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {folderCounts[folder.id as keyof typeof folderCounts]}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-dark-800 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedMail && (
                <button
                  onClick={handleBackToInbox}
                  className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Back to Inbox</span>
                </button>
              )}
              <h1 className="text-xl font-semibold text-white capitalize">
                {selectedMail ? selectedMail.subject : selectedFolder}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              {!selectedMail && (
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 input rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80"
                  />
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 btn-secondary rounded-lg"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto lg:ml-0">
          {selectedMail ? (
            /* Email View - Fullscreen or Half Screen */
            <div className={`card ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'm-2 lg:m-6 min-h-[80vh]'} p-4 lg:p-6 rounded-lg shadow-lg`}>
              <div className="border-b border-dark-700 pb-4 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedMail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          From: {selectedMail.sender?.full_name || selectedMail.sender?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          To: {selectedMail.recipient?.full_name || selectedMail.recipient?.email}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(selectedMail.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(selectedMail.id, selectedMail.is_starred || false)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Star"
                    >
                      {(selectedMail.is_starred || false) ? (
                        <StarIconSolid className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleImportant(selectedMail.id, selectedMail.is_important || false)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Important"
                    >
                      {(selectedMail.is_important || false) ? (
                        <ExclamationTriangleIconSolid className="h-5 w-5 text-red-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTagModal(true)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Add Tag"
                    >
                      <TagIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFileUpload(true)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Attach File"
                    >
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFullscreen(!isFullscreen)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSpam(selectedMail.id)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Mark as Spam"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(selectedMail.id)
                      }}
                      className="p-2 hover:bg-dark-700 rounded-full"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedMail.content}
              </div>
              
              {selectedMail.labels && selectedMail.labels.length > 0 && (
                <div className="mt-6 pt-4 border-t border-dark-700">
                  <div className="flex flex-wrap gap-2">
                    {selectedMail.labels.map((label, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mail List */
            loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : mails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No mails in {selectedFolder}</p>
                <button
                  onClick={() => setShowCompose(true)}
                  className="mt-4 btn-primary"
                >
                  Compose New Mail
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {mails.map((mail) => (
                  <div
                    key={mail.id}
                    onClick={() => handleMailClick(mail)}
                    className={`p-4 cursor-pointer transition-colors ${
                      !mail.is_read ? 'bg-blue-900/20 border-l-4 border-l-blue-400' : 'bg-dark-800 hover:bg-dark-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedMails.includes(mail.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          setSelectedMails(prev => 
                            e.target.checked 
                              ? [...prev, mail.id]
                              : prev.filter(id => id !== mail.id)
                          )
                        }}
                        className="rounded border-gray-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
                      />

                      {/* Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(mail.id, mail.is_starred || false)
                        }}
                        className="p-1 hover:bg-dark-700 rounded"
                      >
                        {(mail.is_starred || false) ? (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      {/* Important */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleImportant(mail.id, mail.is_important || false)
                        }}
                        className="p-1 hover:bg-dark-700 rounded"
                      >
                        {(mail.is_important || false) ? (
                          <ExclamationTriangleIconSolid className="h-4 w-4 text-red-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      {/* Sender */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!mail.is_read ? 'text-white' : 'text-gray-300'}`}>
                            {getSenderName(mail)}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-dark-700 text-gray-300">
                            {getSenderRole(mail)}
                          </span>
                          {!mail.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm truncate ${!mail.is_read ? 'text-white' : 'text-gray-300'}`}>
                          {mail.subject}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {mail.content.substring(0, 100)}...
                        </p>
                        
                        {/* Labels */}
                        {mail.labels && mail.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mail.labels.map((label, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-sm text-gray-400">
                        {new Date(mail.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && selectedMail && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="card p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Tag</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="p-1 hover:bg-dark-700 rounded-full"
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-2 input rounded-lg"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const tagName = e.currentTarget.value.trim()
                      if (tagName) {
                        addTagToMail(selectedMail.id, tagName)
                        setShowTagModal(false)
                      }
                    }
                  }}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      addTagToMail(selectedMail.id, label.name)
                      setShowTagModal(false)
                    }}
                    className="px-3 py-1 rounded-full text-sm hover:bg-dark-700"
                    style={{ backgroundColor: label.color, color: 'white' }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 btn-secondary rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement
                    const tagName = input?.value.trim()
                    if (tagName) {
                      addTagToMail(selectedMail.id, tagName)
                      setShowTagModal(false)
                    }
                  }}
                  className="px-4 py-2 btn-primary rounded-lg"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && selectedMail && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="card p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Attach File</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="p-1 hover:bg-dark-700 rounded-full"
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      uploadFile(file)
                      setShowFileUpload(false)
                    }
                  }}
                  className="w-full px-3 py-2 input rounded-lg"
                  accept="*/*"
                  autoFocus
                />
              </div>
              
              {attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-dark-800 rounded">
                        <span className="text-sm text-white">{attachment.filename}</span>
                        <a
                          href={attachment.downloadUrl}
                          download
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="px-4 py-2 btn-secondary rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="card p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Compose Email</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 hover:bg-dark-700 rounded-full"
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To
                </label>
                <input
                  type="email"
                  placeholder="Enter recipient email..."
                  value={composeData.recipient}
                  onChange={(e) => setComposeData({...composeData, recipient: e.target.value})}
                  className="w-full px-3 py-2 input rounded-lg"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  className="w-full px-3 py-2 input rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  placeholder="Enter your message..."
                  value={composeData.content}
                  onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 input rounded-lg resize-none"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={saveDraft}
                  className="px-4 py-2 btn-secondary rounded-lg"
                >
                  Save Draft
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 btn-secondary rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmail}
                    className="px-4 py-2 btn-primary rounded-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}