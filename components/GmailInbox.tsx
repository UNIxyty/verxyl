'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
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
  is_starred?: boolean
  is_important?: boolean
  is_draft?: boolean
  labels?: string[]
  reply_to_mail_id?: string | null
  thread_id?: string | null
}

interface GmailInboxProps {
  onCompose: () => void
  onViewMail: (mail: Mail) => void
  onUserClick: (user: any) => void
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
  const { theme } = useTheme()
  const [selectedFolder, setSelectedFolder] = useState('inbox')
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

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: FOLDER_ICONS.inbox },
    { id: 'sent', name: 'Sent', icon: FOLDER_ICONS.sent },
    { id: 'drafts', name: 'Drafts', icon: FOLDER_ICONS.drafts },
    { id: 'starred', name: 'Starred', icon: FOLDER_ICONS.starred },
    { id: 'important', name: 'Important', icon: FOLDER_ICONS.important },
    { id: 'spam', name: 'Spam', icon: FOLDER_ICONS.spam },
    { id: 'trash', name: 'Trash', icon: FOLDER_ICONS.trash }
  ]

  // Get theme-based classes
  const getThemeClasses = () => {
    const isLight = theme.startsWith('light')
    return {
      bg: isLight ? 'bg-gray-50' : 'bg-gray-900',
      sidebar: isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700',
      header: isLight ? 'bg-white border-b border-gray-200' : 'bg-gray-800 border-b border-gray-700',
      card: isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700',
      text: isLight ? 'text-gray-900' : 'text-white',
      textSecondary: isLight ? 'text-gray-700' : 'text-gray-300',
      textMuted: isLight ? 'text-gray-600' : 'text-gray-400',
      hover: isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700',
      input: isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-200',
      mailItem: isLight ? 'bg-white hover:bg-gray-50' : 'bg-gray-800 hover:bg-gray-700',
      mailItemUnread: isLight ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-blue-900/20 border-l-4 border-l-blue-400',
      divider: isLight ? 'divide-gray-200' : 'divide-gray-700'
    }
  }

  const themeClasses = getThemeClasses()

  useEffect(() => {
    loadMails()
    loadLabels()
  }, [selectedFolder, searchQuery])

  const loadMails = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: selectedFolder,
        limit: '50'
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/mails?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMails(data.mails || [])
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
      }
    } catch (error) {
      console.error('Error toggling important:', error)
    }
  }

  const markAsRead = async (mailId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/mails/${mailId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !isRead })
      })

      if (response.ok) {
        setMails(mails.map(mail => 
          mail.id === mailId ? { ...mail, is_read: !isRead } : mail
        ))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getSenderName = (mail: Mail) => {
    if (selectedFolder === 'sent') {
      return mail.recipient?.full_name || mail.recipient?.email || 'Unknown'
    } else {
      return mail.sender?.full_name || mail.sender?.email || 'Unknown'
    }
  }

  const getSenderRole = (mail: Mail) => {
    if (selectedFolder === 'sent') {
      return mail.recipient?.role || ''
    } else {
      return mail.sender?.role || ''
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
        // Update local state
        setMails(mails.map(mail => 
          mail.id === mailId 
            ? { ...mail, [property]: value }
            : mail
        ))
        
        // Update selected mail if it's the same
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail({ ...selectedMail, [property]: value })
        }
      } else {
        console.error('Failed to update mail property')
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
      // First ensure the tag exists
      let tag = labels.find(l => l.name === tagName)
      if (!tag) {
        tag = await createTag(tagName, '#3B82F6')
      }

      // Get current mail labels
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

  const removeTagFromMail = async (mailId: string, tagName: string) => {
    try {
      const mail = mails.find(m => m.id === mailId)
      const currentLabels = mail?.labels || []
      const newLabels = currentLabels.filter(label => label !== tagName)
      updateMailProperty(mailId, 'labels', newLabels)
    } catch (error) {
      console.error('Error removing tag from mail:', error)
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
      // Find recipient by email
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
        // Refresh mails
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
        // Refresh mails
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

  return (
    <div className={`flex h-screen ${themeClasses.bg}`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-40 w-64 ${themeClasses.sidebar} flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
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
              const count = folderCounts[folder.id as keyof typeof folderCounts] || 0
              
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : `${themeClasses.textSecondary} ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{folder.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Labels */}
          {labels.length > 0 && (
            <div className="mt-6 px-4">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`text-sm ${themeClasses.textSecondary} ${themeClasses.hover} flex items-center gap-2`}
              >
                <span>Labels</span>
                <span className={`transform transition-transform ${showLabels ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showLabels && (
                <div className="mt-2 space-y-1">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      className={`w-full flex items-center gap-2 px-3 py-1 text-sm ${themeClasses.textSecondary} ${themeClasses.hover} rounded`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: label.color }}
                      />
                      <span>{label.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`${themeClasses.header} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedMail && (
                <button
                  onClick={handleBackToInbox}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Back to Inbox</span>
                </button>
              )}
              <h1 className={`text-xl font-semibold ${themeClasses.text} capitalize`}>
                {selectedMail ? selectedMail.subject : selectedFolder}
              </h1>
            </div>
            
            {/* Search */}
            {!selectedMail && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className={`h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${themeClasses.textMuted}`} />
                  <input
                    type="text"
                    placeholder="Search mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 ${themeClasses.input}`}
                  />
                </div>
              </div>
            )}
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
            /* Email View */
            <div className={`${themeClasses.card} ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'm-2 lg:m-6'} p-4 lg:p-6 rounded-lg shadow-lg`}>
              <div className={`border-b ${theme.startsWith('light') ? 'border-gray-200' : 'border-gray-600'} pb-4 mb-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                      {selectedMail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className={themeClasses.textSecondary}>
                          From: {selectedMail.sender?.full_name || selectedMail.sender?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className={themeClasses.textSecondary}>
                          To: {selectedMail.recipient?.full_name || selectedMail.recipient?.email}
                        </span>
                      </div>
                      <span className={themeClasses.textMuted}>
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
                      className={`p-2 ${themeClasses.hover} rounded-full`}
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
                      className={`p-2 ${themeClasses.hover} rounded-full`}
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
                      className={`p-2 ${themeClasses.hover} rounded-full`}
                      title="Add Tag"
                    >
                      <TagIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFileUpload(true)
                      }}
                      className={`p-2 ${themeClasses.hover} rounded-full`}
                      title="Attach File"
                    >
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFullscreen(!isFullscreen)
                      }}
                      className={`p-2 ${themeClasses.hover} rounded-full`}
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSpam(selectedMail.id)
                      }}
                      className={`p-2 ${themeClasses.hover} rounded-full`}
                      title="Mark as Spam"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(selectedMail.id)
                      }}
                      className={`p-2 ${themeClasses.hover} rounded-full`}
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`${themeClasses.text} leading-relaxed whitespace-pre-wrap`}>
                {selectedMail.content}
              </div>
              
              {selectedMail.labels && selectedMail.labels.length > 0 && (
                <div className={`mt-6 pt-4 border-t ${theme.startsWith('light') ? 'border-gray-200' : 'border-gray-600'}`}>
                  <div className="flex flex-wrap gap-2">
                    {selectedMail.labels.map((label, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${
                          theme.startsWith('light') 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : mails.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <EnvelopeIcon className={`h-12 w-12 ${themeClasses.textMuted} mx-auto mb-4`} />
                <p className={themeClasses.textMuted}>No mails in {selectedFolder}</p>
                <button 
                  onClick={onCompose}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Compose New Mail
                </button>
              </div>
            </div>
          ) : (
            <div className={`divide-y ${themeClasses.divider}`}>
              {mails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleMailClick(mail)}
                  className={`p-4 cursor-pointer transition-colors ${
                    !mail.is_read ? themeClasses.mailItemUnread : themeClasses.mailItem
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedMails.includes(mail.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMails([...selectedMails, mail.id])
                        } else {
                          setSelectedMails(selectedMails.filter(id => id !== mail.id))
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    {/* Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(mail.id, mail.is_starred || false)
                      }}
                      className={`p-1 ${themeClasses.hover} rounded`}
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
                      className={`p-1 ${themeClasses.hover} rounded`}
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
                        <span className={`font-medium ${!mail.is_read ? themeClasses.text : themeClasses.textSecondary}`}>
                          {getSenderName(mail)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          theme.startsWith('light') 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {getSenderRole(mail)}
                        </span>
                        {!mail.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm truncate ${!mail.is_read ? themeClasses.text : themeClasses.textSecondary}`}>
                        {mail.subject}
                      </p>
                      <p className={`text-xs ${themeClasses.textMuted} truncate`}>
                        {mail.content.substring(0, 100)}...
                      </p>
                    </div>

                    {/* Labels */}
                    {mail.labels && mail.labels.length > 0 && (
                      <div className="flex gap-1">
                        {mail.labels.slice(0, 2).map((label, index) => (
                          <span
                            key={index}
                            className={`text-xs px-2 py-1 rounded ${
                              theme.startsWith('light') 
                                ? 'bg-gray-100 text-gray-600' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                        {mail.labels.length > 2 && (
                          <span className={`text-xs ${themeClasses.textMuted}`}>
                            +{mail.labels.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className={`text-sm ${themeClasses.textMuted}`}>
                      {formatDate(mail.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && selectedMail && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`${themeClasses.card} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Add Tag</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className={`p-1 ${themeClasses.hover} rounded-full`}
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Tag Name
                </label>
                <input
                  type="text"
                  placeholder="Enter tag name..."
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input}`}
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
                    className={`px-3 py-1 rounded-full text-sm ${themeClasses.hover}`}
                    style={{ backgroundColor: label.color, color: 'white' }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTagModal(false)}
                  className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg`}
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
                  className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg`}
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
          <div className={`${themeClasses.card} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Attach File</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className={`p-1 ${themeClasses.hover} rounded-full`}
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
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
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input}`}
                  accept="*/*"
                  autoFocus
                />
              </div>
              
              {attachments.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Attachments</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className={`flex items-center justify-between p-2 ${themeClasses.card} rounded`}>
                        <span className={`text-sm ${themeClasses.text}`}>{attachment.filename}</span>
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
                  className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg`}
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
          <div className={`${themeClasses.card} p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Compose Email</h3>
              <button
                onClick={() => setShowCompose(false)}
                className={`p-1 ${themeClasses.hover} rounded-full`}
                autoFocus
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  To
                </label>
                <input
                  type="email"
                  placeholder="Enter recipient email..."
                  value={composeData.recipient}
                  onChange={(e) => setComposeData({...composeData, recipient: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input}`}
                  autoFocus
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Message
                </label>
                <textarea
                  placeholder="Enter your message..."
                  value={composeData.content}
                  onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input} resize-none`}
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={saveDraft}
                  className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg`}
                >
                  Save Draft
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCompose(false)}
                    className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmail}
                    className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg`}
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
