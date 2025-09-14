'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { N8NProjectBackupModal } from '@/components/N8NProjectBackupModal'
import { N8NBackupViewModal } from '@/components/N8NBackupViewModal'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { getN8NProjectBackups } from '@/lib/database'
import { PlusIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { N8NIcon } from '@/components/N8NIcon'

interface N8NProjectBackup {
  id: string
  project_name: string
  workflow_json: any & { filename?: string }
  previous_version_id: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export default function N8NBackupsPage() {
  const { user } = useAuth()
  const [backups, setBackups] = useState<N8NProjectBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<N8NProjectBackup | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  useEffect(() => {
    if (user) {
      loadBackups()
    }
  }, [user])

  const loadBackups = async () => {
    if (!user) return

    try {
      const backupsData = await getN8NProjectBackups(user.id)
      setBackups(backupsData)
    } catch (error) {
      console.error('Error loading N8N project backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    loadBackups()
  }

  const handleViewBackup = (backup: N8NProjectBackup) => {
    setSelectedBackup(backup)
    setIsViewModalOpen(true)
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
      return a.project_name.localeCompare(b.project_name)
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
            <h1 className="text-3xl font-bold text-white mb-2">N8N Project Backups</h1>
            <p className="text-gray-400">Manage and backup your N8N workflows</p>
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
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'name' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Name
            </button>
          </div>
        )}

        {backups.length === 0 ? (
          <div className="card text-center py-12">
            <N8NIcon className="mx-auto h-16 w-16 text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No N8N project backups</h3>
            <p className="text-gray-400 mb-6">
              Start backing up your N8N workflows to keep track of your automation projects.
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
          <div className="space-y-4">
            {sortedBackups.map((backup) => (
              <div key={backup.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <N8NIcon className="h-5 w-5 text-primary-400" />
                      <h3 className="text-lg font-semibold text-white">{backup.project_name}</h3>
                      <span className="text-sm text-gray-400">
                        {formatDate(backup.created_at)}
                      </span>
                    </div>
                    
                    {backup.description && (
                      <p className="text-gray-300 mb-3">{backup.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Nodes: {backup.workflow_json?.nodes?.length || 0}</span>
                        <span>Connections: {backup.workflow_json?.connections?.length || 0}</span>
                        {backup.previous_version_id && (
                          <span className="text-primary-400">Based on previous version</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleViewBackup(backup)}
                        className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </div>

                    {/* Show filename if available */}
                    {backup.workflow_json?.filename && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>File: {backup.workflow_json.filename}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        <N8NProjectBackupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />

        <N8NBackupViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          backup={selectedBackup}
        />
      </div>
    </DashboardLayout>
  )
}
