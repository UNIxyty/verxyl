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
    <Modal isOpen={isOpen} onClose={onClose} title={backup.ai_model} size="xl">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Created</h4>
            <p className="text-gray-200">{formatDate(backup.created_at)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">AI Model</h4>
            <p className="text-gray-200">{backup.ai_model}</p>
          </div>
        </div>

        {/* Prompt Text Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Prompt Text</h4>
          <div className="bg-dark-700 rounded-lg p-4 mt-2">
            <pre className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
              {backup.prompt_text}
            </pre>
          </div>
        </div>

        {/* Output Logic Section */}
        {backup.output_logic && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Output Logic</h4>
            <div className="bg-dark-700 rounded-lg p-4 mt-2">
              <pre className="text-gray-200 text-xs">
                {JSON.stringify(backup.output_logic, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Output Result Section */}
        {backup.output_result && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Output Result</h4>
            <div className="bg-dark-700 rounded-lg p-4 mt-2">
              <pre className="text-gray-200 text-xs">
                {JSON.stringify(backup.output_result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Download Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Download</h4>
          <button
            onClick={downloadPrompt}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 mt-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download as TXT
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
