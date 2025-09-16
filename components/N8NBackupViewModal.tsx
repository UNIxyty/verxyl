'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { UserSelectShareModal } from './UserSelectShareModal'
import { DocumentTextIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface N8NProjectBackup {
  id: string
  project_name: string
  workflow_json: any & { filename?: string }
  previous_version_id: string | null
  description: string | null
  created_at: string
  updated_at: string
}

interface N8NBackupViewModalProps {
  isOpen: boolean
  onClose: () => void
  backup: N8NProjectBackup | null
}

export function N8NBackupViewModal({ isOpen, onClose, backup }: N8NBackupViewModalProps) {
  const [showJson, setShowJson] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  if (!backup) return null

  const downloadFile = (content: string, filename: string, mimeType: string = 'application/json') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async (recipientEmail: string) => {
    const response = await fetch('/api/n8n-backups/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backup_id: backup.id,
        recipient_email: recipientEmail
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to share backup')
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={backup.project_name} size="xl">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Created</h4>
            <p className="text-gray-200">{formatDate(backup.created_at)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Project Name</h4>
            <p className="text-gray-200">{backup.project_name}</p>
          </div>
        </div>

        {/* Description */}
        {backup.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
            <p className="text-gray-200 bg-dark-700 rounded-lg p-3">{backup.description}</p>
          </div>
        )}

        {/* File Info */}
        {backup.workflow_json?.filename && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Original File</h4>
            <div className="flex items-center space-x-2 bg-dark-700 rounded-lg p-3">
              <DocumentTextIcon className="h-5 w-5 text-primary-400" />
              <span className="text-gray-200">{backup.workflow_json.filename}</span>
            </div>
          </div>
        )}

        {/* Workflow Stats */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Workflow Information</h4>
          <div className="bg-dark-700 rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Nodes:</span>
                <span className="text-gray-200 ml-2">{backup.workflow_json?.nodes?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Connections:</span>
                <span className="text-gray-200 ml-2">{backup.workflow_json?.connections?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Triggers:</span>
                <span className="text-gray-200 ml-2">
                  {backup.workflow_json?.nodes?.filter((node: any) => node.type.includes('Trigger')).length || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Actions:</span>
                <span className="text-gray-200 ml-2">
                  {backup.workflow_json?.nodes?.filter((node: any) => !node.type.includes('Trigger')).length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Section */}
        <div className="border-t border-dark-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-300">Workflow JSON</h4>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>{showJson ? 'Hide' : 'View'} JSON</span>
            </button>
          </div>

          {showJson && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const jsonString = JSON.stringify(backup.workflow_json, null, 2)
                    const filename = backup.workflow_json?.filename || `${backup.project_name}.json`
                    downloadFile(jsonString, filename, 'application/json')
                  }}
                  className="btn-secondary flex items-center text-sm px-3 py-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download JSON
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(backup.workflow_json, null, 2), 'Workflow JSON')}
                  className="btn-secondary flex items-center text-sm px-3 py-2"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                  Copy JSON
                </button>
              </div>

              {/* JSON Display */}
              <div className="bg-dark-700 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-gray-200 text-sm whitespace-pre-wrap">
                  {JSON.stringify(backup.workflow_json, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-dark-700">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <UserSelectShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShare}
        title="Share N8N Workflow"
        itemName="N8N workflow"
      />
    </Modal>
  )
}
