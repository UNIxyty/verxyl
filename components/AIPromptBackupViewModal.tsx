'use client'

import { Modal } from './Modal'
import { ArrowDownTrayIcon, DocumentTextIcon, LightBulbIcon } from '@heroicons/react/24/outline'

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

interface AIPromptBackupViewModalProps {
  isOpen: boolean
  onClose: () => void
  backup: AIPromptBackup | null
}

export function AIPromptBackupViewModal({ isOpen, onClose, backup }: AIPromptBackupViewModalProps) {
  if (!backup) return null

  const downloadPrompt = () => {
    const promptData = {
      id: backup.id,
      prompt_text: backup.prompt_text,
      ai_model: backup.ai_model,
      output_logic: backup.output_logic,
      output_result: backup.output_result,
      created_at: backup.created_at,
      updated_at: backup.updated_at
    }

    const dataStr = JSON.stringify(promptData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `ai-prompt-${backup.ai_model}-${new Date(backup.created_at).toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Prompt Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-dark-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-white">{backup.ai_model}</span>
            </div>
            <button
              onClick={downloadPrompt}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Created: {formatDate(backup.created_at)}
          </div>
          {backup.updated_at !== backup.created_at && (
            <div className="text-sm text-gray-400">
              Updated: {formatDate(backup.updated_at)}
            </div>
          )}
        </div>

        {/* Prompt Text */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Prompt Text
          </h3>
          <div className="bg-dark-700 rounded-lg p-4">
            <pre className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
              {backup.prompt_text}
            </pre>
          </div>
        </div>

        {/* Output Logic */}
        {backup.output_logic && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Output Logic</h3>
            <div className="bg-dark-700 rounded-lg p-4">
              <pre className="text-gray-200 text-sm">
                {JSON.stringify(backup.output_logic, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Output Result */}
        {backup.output_result && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Output Result</h3>
            <div className="bg-dark-700 rounded-lg p-4">
              <pre className="text-gray-200 text-sm">
                {JSON.stringify(backup.output_result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4">
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
