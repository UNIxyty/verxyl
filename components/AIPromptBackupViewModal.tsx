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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Prompt Details" size="xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-dark-700 pb-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-medium text-white">{backup.ai_model}</span>
            </div>
            <button
              onClick={downloadPrompt}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download as TXT
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

        {/* Main Content - Full Height */}
        <div className="flex-1 overflow-auto space-y-6">
          {/* Prompt Text */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Prompt Text
            </h3>
            <div className="bg-dark-700 rounded-lg p-6">
              <pre className="text-gray-200 whitespace-pre-wrap text-base leading-relaxed font-mono">
                {backup.prompt_text}
              </pre>
            </div>
          </div>

          {/* Output Logic */}
          {backup.output_logic && (
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-4">Output Logic</h3>
              <div className="bg-dark-700 rounded-lg p-6">
                <pre className="text-gray-200 text-sm font-mono">
                  {JSON.stringify(backup.output_logic, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Output Result */}
          {backup.output_result && (
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-4">Output Result</h3>
              <div className="bg-dark-700 rounded-lg p-6">
                <pre className="text-gray-200 text-sm font-mono">
                  {JSON.stringify(backup.output_result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-dark-700 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
