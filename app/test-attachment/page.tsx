'use client'

import { useState } from 'react'

export default function TestAttachmentPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mailId, setMailId] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const createTestMail = async () => {
    setIsLoading(true)
    setResult('Creating test mail...')
    
    try {
      const response = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: 'fbbc5913-1540-42ef-b333-65e1654160b8', // Replace with your user ID
          subject: 'Test Email for File Upload',
          content: 'This is a test email for testing file uploads.'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMailId(data.mail.id)
        setResult(`✅ Test mail created successfully!\nMail ID: ${data.mail.id}`)
      } else {
        setResult(`❌ Failed to create test mail: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error creating test mail: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFileUpload = async () => {
    if (!selectedFile) {
      setResult('❌ Please select a file first')
      return
    }

    if (!mailId) {
      setResult('❌ Please create a test mail first or enter a mail ID')
      return
    }

    setIsLoading(true)
    setResult('Testing file upload...')

    try {
      // Create FormData properly
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mailId', mailId)

      console.log('FormData created with:', {
        file: selectedFile.name,
        mailId: mailId
      })

      // Test with debug API first
      setResult('Testing with debug API...')
      const debugResponse = await fetch('/api/debug-attachment-upload', {
        method: 'POST',
        body: formData
      })

      const debugResult = await debugResponse.json()
      console.log('Debug result:', debugResult)

      if (!debugResponse.ok) {
        setResult(`❌ Debug test failed: ${debugResult.error}\nDetails: ${debugResult.debug || 'No details available'}`)
        return
      }

      // If debug passes, try actual upload
      setResult('Debug passed! Testing actual upload...')
      const uploadResponse = await fetch('/api/mails/attachments', {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()

      if (uploadResponse.ok) {
        setResult(`✅ File upload successful!\nAttachment ID: ${uploadResult.attachment.id}\nFilename: ${uploadResult.attachment.filename}`)
      } else {
        setResult(`❌ Upload failed: ${uploadResult.error}\nDetails: ${uploadResult.details || 'No details available'}`)
      }
    } catch (error) {
      setResult(`❌ Error uploading file: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkStorageStatus = async () => {
    setIsLoading(true)
    setResult('Checking storage status...')

    try {
      const response = await fetch('/api/check-storage-status')
      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Storage Status Check:\n\nBuckets: ${JSON.stringify(data.storage.buckets, null, 2)}\n\nMail Attachments Bucket: ${JSON.stringify(data.storage.mailAttachmentsBucket, null, 2)}\n\nDatabase Table: ${JSON.stringify(data.database.mailAttachmentsTable, null, 2)}`)
      } else {
        setResult(`❌ Status check failed: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error checking status: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setMailId('')
    setResult('')
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mail Attachment Upload Test</h1>
        
        {/* Storage Status Check */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 0: Check Storage Status</h2>
          <button
            onClick={checkStorageStatus}
            disabled={isLoading}
            className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Storage Status'}
          </button>
          <p className="text-sm text-gray-400 mt-2">
            Check if storage bucket and database table are properly set up.
          </p>
        </div>

        {/* Create Test Mail */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Create Test Mail</h2>
          <button
            onClick={createTestMail}
            disabled={isLoading}
            className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Test Mail'}
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
          <h2 className="text-xl font-semibold mb-4">Step 4: Test Upload</h2>
          <button
            onClick={testFileUpload}
            disabled={isLoading || !selectedFile || !mailId}
            className="btn-primary px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test File Upload'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-dark-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="whitespace-pre-wrap text-sm bg-dark-700 p-4 rounded-lg overflow-x-auto">
              {result}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={clearAll}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            Clear All
          </button>
        </div>

        {/* Console Testing Instructions */}
        <div className="bg-dark-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Console Testing</h2>
          <p className="text-sm text-gray-300 mb-4">
            You can also test in the browser console using the script below:
          </p>
          <pre className="text-xs text-gray-300 bg-dark-700 p-4 rounded-lg overflow-x-auto">
{`// Load and run the test script
fetch('/test-attachment-upload.js')
  .then(r => r.text())
  .then(script => {
    eval(script);
    runCompleteTest(); // Run the complete test
  });`}
          </pre>
        </div>
      </div>
    </div>
  )
}
