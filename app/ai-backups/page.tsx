'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { AIPromptBackupModal } from '@/components/AIPromptBackupModal'
import { AIPromptBackupViewModal } from '@/components/AIPromptBackupViewModal'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { LightBulbIcon, PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface AIPromptBackup {
  id: string
  prompt_text: string
  ai_model: string
  previous_version_id: string | null
  output_logic: any | null
  output_result: any | null
  created_at: string
  updated_at: string
}

export default function AIBackupsPage() {
  const { user } = useAuth()
  const [backups, setBackups] = useState<AIPromptBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<AIPromptBackup | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')

  useEffect(() => {
    if (user) {
      loadBackups()
    }
  }, [user])

  const loadBackups = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/ai-backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      } else {
        console.error('Failed to load AI prompt backups:', response.status)
      }
    } catch (error) {
      console.error('Error loading AI prompt backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    loadBackups()
  }

  const downloadPrompt = (backup: AIPromptBackup) => {
    const exportFileDefaultName = `ai-prompt-${backup.ai_model}-${new Date(backup.created_at).toISOString().split('T')[0]}.txt`
    
    const blob = new Blob([backup.prompt_text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileDefaultName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  const sortedBackups = [...backups].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return a.prompt_text.localeCompare(b.prompt_text)
    }
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Prompt Backups</h1>
            <p className="text-gray-400">Manage and backup your AI prompts</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Save Backup
          </button>
        </div>

        {backups.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'date' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'title' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Title
            </button>
          </div>
        )}

        {backups.length === 0 ? (
          <div className="card text-center py-12">
            <LightBulbIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No AI prompt backups</h3>
            <p className="text-gray-400 mb-6">
              Start backing up your AI prompts to keep track of your work and results.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Save Your First Backup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBackups.map((backup) => {
              // Extract title from prompt text (first line or first 50 chars)
              const title = backup.prompt_text.split('\n')[0] || backup.prompt_text.substring(0, 50)
              const description = backup.prompt_text.length > 100 
                ? backup.prompt_text.substring(0, 100) + '...'
                : backup.prompt_text
              
              return (
                <div key={backup.id} className="card hover:bg-dark-700 transition-colors cursor-pointer" onClick={() => {
                  setSelectedBackup(backup)
                  setIsViewModalOpen(true)
                }}>
                  <div className="flex items-start justify-between mb-3">
                    <DocumentTextIcon className="h-6 w-6 text-primary-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-primary-400 bg-primary-900 px-2 py-1 rounded">
                      {backup.ai_model}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(backup.created_at)}</span>
                    <span className="text-primary-400 hover:text-primary-300 font-medium">
                      Click to view
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        <AIPromptBackupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />

        <AIPromptBackupViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          backup={selectedBackup}
        />
      </div>
    </DashboardLayout>
  )
}
