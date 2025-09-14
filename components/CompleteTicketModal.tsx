'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { FilePicker } from './FilePicker'
import { completeTicket } from '@/lib/database'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'

interface CompleteTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  onSuccess: () => void
}

interface CompleteTicketForm {
  solution_type: 'prompt' | 'n8n_workflow' | 'other'
  prompt_text: string
  output_result: string
  workflow_file: FileList
  other_description: string
  other_file: FileList
  other_output: string
}

export function CompleteTicketModal({ isOpen, onClose, ticketId, onSuccess }: CompleteTicketModalProps) {
  const [loading, setLoading] = useState(false)
  const [solutionType, setSolutionType] = useState<'prompt' | 'n8n_workflow' | 'other' | null>(null)
  const [outputResult, setOutputResult] = useState('')
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompleteTicketForm>()

  const onSubmit = async (data: CompleteTicketForm) => {
    setLoading(true)
    try {
      let solutionData: any = {}
      let finalOutputResult: any = null

      switch (solutionType) {
        case 'prompt':
          solutionData = {
            prompt_text: data.prompt_text,
            type: 'prompt'
          }
          finalOutputResult = data.output_result ? JSON.parse(data.output_result) : null
          break
        
        case 'n8n_workflow':
          if (data.workflow_file && data.workflow_file[0]) {
            const file = data.workflow_file[0]
            const text = await file.text()
            solutionData = {
              workflow_json: JSON.parse(text),
              filename: file.name,
              type: 'n8n_workflow'
            }
          }
          finalOutputResult = data.output_result ? JSON.parse(data.output_result) : null
          break
        
        case 'other':
          solutionData = {
            description: data.other_description,
            type: 'other'
          }
          if (data.other_file && data.other_file[0]) {
            const file = data.other_file[0]
            const text = await file.text()
            solutionData.file_content = text
            solutionData.filename = file.name
          }
          finalOutputResult = data.other_output ? JSON.parse(data.other_output) : null
          break
      }

      await completeTicket(ticketId, {
        solutionType: solutionType!,
        solutionData: solutionData,
        outputResult: finalOutputResult
      })

      toast.success('Ticket completed successfully!')
      reset()
      setSolutionType(null)
      setOutputResult('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error completing ticket:', error)
      toast.error('Failed to complete ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSolutionType(null)
    setOutputResult('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Ticket" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Solution Type *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="prompt"
                {...register('solution_type', { required: 'Solution type is required' })}
                onChange={(e) => setSolutionType(e.target.value as any)}
                className="mr-3 text-primary-600"
              />
              <span className="text-white">AI Prompt</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="n8n_workflow"
                {...register('solution_type')}
                onChange={(e) => setSolutionType(e.target.value as any)}
                className="mr-3 text-primary-600"
              />
              <span className="text-white">N8N Workflow</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="other"
                {...register('solution_type')}
                onChange={(e) => setSolutionType(e.target.value as any)}
                className="mr-3 text-primary-600"
              />
              <span className="text-white">Other</span>
            </label>
          </div>
          {errors.solution_type && (
            <p className="mt-1 text-sm text-red-400">{errors.solution_type.message}</p>
          )}
        </div>

        {solutionType === 'prompt' && (
          <>
            <div>
              <label htmlFor="prompt_text" className="block text-sm font-medium text-gray-300 mb-2">
                Prompt Text *
              </label>
              <textarea
                id="prompt_text"
                rows={6}
                {...register('prompt_text', { required: solutionType === 'prompt' ? 'Prompt text is required' : false })}
                className="textarea w-full"
                placeholder="Enter the prompt text used..."
              />
              {errors.prompt_text && (
                <p className="mt-1 text-sm text-red-400">{errors.prompt_text.message}</p>
              )}
            </div>
          </>
        )}

        {solutionType === 'n8n_workflow' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              N8N Workflow File (JSON) *
            </label>
            <FilePicker
              accept=".json"
              onChange={(file) => {
                // Handle file selection
                if (file) {
                  const fileList = new DataTransfer()
                  fileList.items.add(file)
                  const input = document.getElementById('workflow_file') as HTMLInputElement
                  if (input) {
                    input.files = fileList.files
                  }
                }
              }}
              placeholder="Choose N8N workflow JSON file or drag and drop"
              className="w-full"
              maxSize={5}
            />
            <input
              type="file"
              id="workflow_file"
              accept=".json"
              {...register('workflow_file', { required: solutionType === 'n8n_workflow' ? 'Workflow file is required' : false })}
              className="hidden"
            />
            {errors.workflow_file && (
              <p className="mt-1 text-sm text-red-400">{errors.workflow_file.message}</p>
            )}
          </div>
        )}

        {solutionType === 'other' && (
          <>
            <div>
              <label htmlFor="other_description" className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="other_description"
                rows={4}
                {...register('other_description', { required: solutionType === 'other' ? 'Description is required' : false })}
                className="textarea w-full"
                placeholder="Describe the solution..."
              />
              {errors.other_description && (
                <p className="mt-1 text-sm text-red-400">{errors.other_description.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File (Optional)
              </label>
              <FilePicker
                onChange={(file) => {
                  // Handle file selection
                  if (file) {
                    const fileList = new DataTransfer()
                    fileList.items.add(file)
                    const input = document.getElementById('other_file') as HTMLInputElement
                    if (input) {
                      input.files = fileList.files
                    }
                  }
                }}
                placeholder="Choose file or drag and drop"
                className="w-full"
                maxSize={10}
              />
              <input
                type="file"
                id="other_file"
                {...register('other_file')}
                className="hidden"
              />
            </div>
          </>
        )}

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
            disabled={loading || !solutionType}
          >
            {loading ? 'Completing...' : 'Complete Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
