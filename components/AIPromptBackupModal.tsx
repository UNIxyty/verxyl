'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { createAIPromptBackup, getAIPromptBackups } from '@/lib/database'
import { useAuth } from './AuthProvider'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'

interface AIPromptBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface AIPromptBackupForm {
  prompt_text: string
  ai_model: string
  previous_version_id: string
  output_logic: string
  output_result: string
}

interface AIPromptBackup {
  id: string
  prompt_text: string
  ai_model: string
  created_at: string
}

export function AIPromptBackupModal({ isOpen, onClose, onSuccess }: AIPromptBackupModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [previousBackups, setPreviousBackups] = useState<AIPromptBackup[]>([])
  const [outputLogic, setOutputLogic] = useState('')
  const [outputResult, setOutputResult] = useState('')
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<AIPromptBackupForm>()
  const selectedPreviousVersion = watch('previous_version_id')

  useEffect(() => {
    if (isOpen && user) {
      loadPreviousBackups()
    }
  }, [isOpen, user])

  const loadPreviousBackups = async () => {
    if (!user) return

    try {
      const backups = await getAIPromptBackups(user.id)
      setPreviousBackups(backups)
    } catch (error) {
      console.error('Error loading previous backups:', error)
    }
  }

  const onSubmit = async (data: AIPromptBackupForm) => {
    if (!user) return

    setLoading(true)
    try {
      await createAIPromptBackup({
        user_id: user.id,
        prompt_text: data.prompt_text,
        ai_model: data.ai_model,
        previous_version_id: data.previous_version_id || null,
        output_logic: outputLogic ? JSON.parse(outputLogic) : null,
        output_result: outputResult ? JSON.parse(outputResult) : null,
      })

      toast.success('AI Prompt backup saved successfully!')
      reset()
      setOutputLogic('')
      setOutputResult('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving AI prompt backup:', error)
      toast.error('Failed to save backup')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setOutputLogic('')
    setOutputResult('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save AI Prompt Backup" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="prompt_text" className="block text-sm font-medium text-gray-300 mb-2">
            Prompt Text *
          </label>
          <textarea
            id="prompt_text"
            rows={6}
            {...register('prompt_text', { required: 'Prompt text is required' })}
            className="textarea w-full"
            placeholder="Enter the AI prompt..."
          />
          {errors.prompt_text && (
            <p className="mt-1 text-sm text-red-400">{errors.prompt_text.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="ai_model" className="block text-sm font-medium text-gray-300 mb-2">
            AI Model *
          </label>
          <select
            id="ai_model"
            {...register('ai_model', { required: 'AI model is required' })}
            className="select w-full"
          >
            <option value="">Select AI model</option>
            <optgroup label="Recently Used">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
            </optgroup>
            <optgroup label="Other Models">
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="gemini-pro">Gemini Pro</option>
              <option value="custom">Custom Model</option>
            </optgroup>
          </select>
          {errors.ai_model && (
            <p className="mt-1 text-sm text-red-400">{errors.ai_model.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="previous_version_id" className="block text-sm font-medium text-gray-300 mb-2">
            Previous Version (Optional)
          </label>
          <select
            id="previous_version_id"
            {...register('previous_version_id')}
            className="select w-full"
          >
            <option value="">No previous version</option>
            {previousBackups.map((backup) => (
              <option key={backup.id} value={backup.id}>
                {backup.ai_model} - {new Date(backup.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          {selectedPreviousVersion && (
            <div className="mt-2 p-3 bg-dark-700 rounded-lg">
              <p className="text-sm text-gray-300">
                Selected version: {previousBackups.find(b => b.id === selectedPreviousVersion)?.prompt_text.substring(0, 100)}...
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Output Logic (JSON)
          </label>
          <div className="border border-dark-600 rounded-lg overflow-hidden">
            <Editor
              height="200px"
              defaultLanguage="json"
              value={outputLogic}
              onChange={(value) => setOutputLogic(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
          <input
            type="hidden"
            {...register('output_logic')}
            value={outputLogic}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Output Result (JSON)
          </label>
          <div className="border border-dark-600 rounded-lg overflow-hidden">
            <Editor
              height="200px"
              defaultLanguage="json"
              value={outputResult}
              onChange={(value) => setOutputResult(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
          <input
            type="hidden"
            {...register('output_result')}
            value={outputResult}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Backup'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
