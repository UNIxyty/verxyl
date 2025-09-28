'use client'

import { useState, useRef } from 'react'
import { DocumentArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { uploadInvoicePDF } from '@/lib/invoice-storage'
import toast from 'react-hot-toast'

interface InvoicePDFUploadProps {
  invoiceId?: string
  currentPdfUrl?: string
  onUploadSuccess: (url: string) => void
  disabled?: boolean
}

export function InvoicePDFUpload({ 
  invoiceId, 
  currentPdfUrl, 
  onUploadSuccess, 
  disabled = false 
}: InvoicePDFUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!invoiceId) {
      toast.error('Invoice ID is required for file upload')
      return
    }

    setUploading(true)
    try {
      const result = await uploadInvoicePDF(file, invoiceId)
      
      if (result.success && result.url) {
        toast.success('PDF uploaded successfully!')
        onUploadSuccess(result.url)
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploading) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || uploading) return

    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemove = () => {
    onUploadSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Invoice PDF
      </label>
      
      {currentPdfUrl ? (
        // Show current PDF
        <div className="flex items-center justify-between p-3 bg-dark-700 border border-dark-600 rounded-lg">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-white font-medium">PDF Uploaded</p>
              <p className="text-gray-400 text-sm">
                <a 
                  href={currentPdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300"
                >
                  View PDF
                </a>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        // Show upload area
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive 
              ? 'border-primary-500 bg-primary-900/20' 
              : 'border-dark-600 hover:border-dark-500'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <DocumentArrowUpIcon className={`
            h-12 w-12 mx-auto mb-4 transition-colors
            ${dragActive ? 'text-primary-400' : 'text-gray-400'}
          `} />
          
          {uploading ? (
            <div>
              <p className="text-white font-medium mb-1">Uploading...</p>
              <div className="w-32 h-2 bg-dark-600 rounded-full mx-auto">
                <div className="h-2 bg-primary-500 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-white font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-400 text-sm">
                PDF files only, up to 10MB
              </p>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-400">
        {invoiceId 
          ? 'PDF will be stored securely and accessible to clients via the invoice link'
          : 'Save the invoice first to enable PDF upload'
        }
      </p>
    </div>
  )
}
