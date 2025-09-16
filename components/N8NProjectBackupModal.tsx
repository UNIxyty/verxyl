'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { FilePicker } from './FilePicker'
import { useAuth } from './AuthProvider'
import toast from 'react-hot-toast'

interface N8NProjectBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface N8NProjectBackupForm {
  project_name: string
  description: string
}

export function N8NProjectBackupModal({ isOpen, onClose, onSuccess }: N8NProjectBackupModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [outputResult, setOutputResult] = useState('')
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<N8NProjectBackupForm>()

  const onSubmit = async (data: N8NProjectBackupForm) => {
    if (!user) return

    if (!selectedFile) {
      toast.error('Please select a workflow file')
      return
    }

    let workflowData
    try {
      const fileText = await selectedFile.text()
      workflowData = JSON.parse(fileText)
    } catch (error) {
      toast.error('Invalid JSON file')
      return
    }

    setLoading(true)
    try {
      // Add filename to the workflow data
      const workflowWithFilename = {
        ...workflowData,
        filename: selectedFile.name
      }

      const response = await fetch('/api/n8n-backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: data.project_name,
          workflow_json: workflowWithFilename,
          description: data.description || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create backup')
      }

      toast.success('N8N Project backup saved successfully!')
      reset()
      setSelectedFile(null)
      setOutputResult('')
      setShowJsonEditor(false)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving N8N project backup:', error)
      toast.error('Failed to save backup')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    setOutputResult('')
    setShowJsonEditor(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save N8N Project Backup" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="project_name" className="block text-sm font-medium text-gray-300 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="project_name"
            {...register('project_name', { required: 'Project name is required' })}
            className="input w-full"
            placeholder="Enter project name"
          />
          {errors.project_name && (
            <p className="mt-1 text-sm text-red-400">{errors.project_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="textarea w-full"
            placeholder="Describe this N8N project..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            N8N Workflow File (JSON) *
          </label>
          <FilePicker
            accept=".json"
            onChange={setSelectedFile}
            value={selectedFile}
            placeholder="Choose N8N workflow JSON file or drag and drop"
            className="w-full"
            maxSize={5}
          />
        </div>

        {/* JSON Output Editor - Collapsible */}
        <div className="border-t border-dark-700 pt-4">
          <button
            type="button"
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <span>{showJsonEditor ? 'Hide' : 'Add'} JSON Output Result</span>
            <svg 
              className={`h-4 w-4 transition-transform ${showJsonEditor ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showJsonEditor && (
            <div className="mt-3">
              <label htmlFor="output_result" className="block text-sm font-medium text-gray-300 mb-2">
                Output Result (JSON)
              </label>
              <textarea
                id="output_result"
                rows={6}
                value={outputResult}
                onChange={(e) => setOutputResult(e.target.value)}
                className="textarea w-full font-mono text-sm"
                placeholder="Paste your JSON output result here..."
              />
            </div>
          )}
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
            disabled={loading || !selectedFile}
          >
            {loading ? 'Saving...' : 'Save Backup'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
