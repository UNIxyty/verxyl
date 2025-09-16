'use client'

import { useState } from 'react'

export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mailId, setMailId] = useState('')
  const [result, setResult] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const createTestMail = async () => {
    try {
      const response = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: 'fbbc5913-1540-42ef-b333-65e1654160b8', // Replace with your user ID
          subject: 'Test Email for File Upload',
          content: 'This is a test email created for testing file uploads.'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMailId(data.mail.id)
        setResult(`✅ Test mail created successfully!<br>Mail ID: ${data.mail.id}`)
      } else {
        setResult(`❌ Failed to create test mail: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error creating test mail: ${error}`)
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) {
      setResult('❌ Please select a file first')
      return
    }

    if (!mailId) {
      setResult('❌ Please create a test mail first or enter a mail ID')
      return
    }

    setIsUploading(true)
    setResult('⏳ Uploading file...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mailId', mailId)

      const response = await fetch('/api/mails/attachments', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ File uploaded successfully!<br>Attachment ID: ${data.attachment.id}<br>Filename: ${data.attachment.filename}`)
      } else {
        setResult(`❌ Upload failed: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error uploading file: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  const testDownload = async () => {
    if (!selectedFile) {
      setResult('❌ Please upload a file first')
      return
    }

    try {
      // This would need the actual attachment ID from the upload response
      setResult('ℹ️ Download test - check the upload result for the attachment ID, then use: /api/mails/attachments/[ID]/download')
    } catch (error) {
      setResult(`❌ Error testing download: ${error}`)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setMailId('')
    setResult('')
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mail Attachment Upload Test</h1>
        
        {/* Create Test Mail */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Create Test Mail</h2>
          <button
            onClick={createTestMail}
            className="btn-primary px-4 py-2 rounded-lg"
          >
            Create Test Mail
          </button>
          <p className="text-sm text-gray-400 mt-2">
            This creates a test email to attach files to.
          </p>
        </div>

        {/* File Selection */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Select File</h2>
          
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="fileInput"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <p className="text-gray-400 mb-2">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select a file'}
              </p>
              <p className="text-sm text-gray-500">
                Supported: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="bg-dark-700 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">File Details:</h3>
              <p><strong>Name:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {selectedFile.type}</p>
            </div>
          )}
        </div>

        {/* Mail ID Input */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Mail ID</h2>
          <input
            type="text"
            value={mailId}
            onChange={(e) => setMailId(e.target.value)}
            placeholder="Mail ID (auto-filled when creating test mail)"
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-sm text-gray-400 mt-2">
            This will be auto-filled when you create a test mail, or enter an existing mail ID.
          </p>
        </div>

        {/* Upload Button */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 4: Upload File</h2>
          <button
            onClick={uploadFile}
            disabled={isUploading || !selectedFile || !mailId}
            className="btn-primary px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-dark-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: result }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={testDownload}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            Test Download
          </button>
          <button
            onClick={clearAll}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            Clear All
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-dark-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create Test Mail" to generate a test email</li>
            <li>Select a file to upload (PDF, DOC, DOCX, TXT, JPG, PNG)</li>
            <li>The Mail ID will be auto-filled from step 1</li>
            <li>Click "Upload File" to test the attachment upload</li>
            <li>Check the result for success/error messages</li>
            <li>Use the attachment ID from the result to test downloads</li>
          </ol>
          
          <div className="mt-4 p-4 bg-dark-700 rounded-lg">
            <h3 className="font-semibold mb-2">Manual Testing in Console:</h3>
            <pre className="text-xs text-gray-300 overflow-x-auto">
{`// Create test file
const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

// Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('mailId', 'YOUR_MAIL_ID_HERE');

fetch('/api/mails/attachments', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
