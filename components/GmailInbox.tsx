'use client'

import { useState, useEffect } from 'react'
import { 
  EnvelopeIcon, 
  PaperAirplaneIcon, 
  DocumentDuplicateIcon,
  StarIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon
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
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [mails, setMails] = useState<Mail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMails, setSelectedMails] = useState<string[]>([])
  const [folderCounts, setFolderCounts] = useState(FOLDER_COUNTS)
  const [showLabels, setShowLabels] = useState(false)
  const [labels, setLabels] = useState<any[]>([])

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

  const handleMailClick = async (mail: Mail) => {
    if (!mail.is_read) {
      await markAsRead(mail.id, false)
    }
    onViewMail(mail)
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={onCompose}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
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
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
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
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
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
                      className="w-full flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 capitalize">
              {selectedFolder}
            </h1>
            
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mail List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : mails.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No mails in {selectedFolder}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {mails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleMailClick(mail)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !mail.is_read ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
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
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />

                    {/* Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(mail.id, mail.is_starred || false)
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
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
                      className="p-1 hover:bg-gray-200 rounded"
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
                        <span className={`font-medium ${!mail.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {getSenderName(mail)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getSenderRole(mail)}
                        </span>
                        {!mail.is_read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm truncate ${!mail.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {mail.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {mail.content.substring(0, 100)}...
                      </p>
                    </div>

                    {/* Labels */}
                    {mail.labels && mail.labels.length > 0 && (
                      <div className="flex gap-1">
                        {mail.labels.slice(0, 2).map((label, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {label}
                          </span>
                        ))}
                        {mail.labels.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{mail.labels.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-sm text-gray-500">
                      {formatDate(mail.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
