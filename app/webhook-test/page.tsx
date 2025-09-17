'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'react-hot-toast'

export default function WebhookTestPage() {
  const { user } = useAuth()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testPayload, setTestPayload] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      let payload
      try {
        payload = testPayload ? JSON.parse(testPayload) : null
      } catch (e) {
        toast.error('Invalid JSON in test payload')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/debug-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, testPayload: payload })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success('Webhook test successful!')
      } else {
        toast.error(`Webhook test failed: ${data.error}`)
      }

    } catch (error) {
      console.error('Webhook test error:', error)
      toast.error('Failed to test webhook')
      setResult({ error: 'Network error', details: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserWebhooks = async () => {
    if (!user?.id) {
      toast.error('User not found')
      return
    }

    try {
      const response = await fetch(`/api/debug-webhook?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        toast.success('Loaded user webhook settings')
      } else {
        toast.error(data.error || 'Failed to load webhook settings')
      }
    } catch (error) {
      console.error('Load webhooks error:', error)
      toast.error('Failed to load webhook settings')
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Webhook Debug Tool</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Webhook */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Webhook URL</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-webhook-endpoint.com/webhook"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Payload (JSON - optional)
                </label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='{"type": "test", "message": "Hello from Verxyl"}'
                  className="input w-full h-32 resize-none"
                />
              </div>

              <button
                onClick={testWebhook}
                disabled={isLoading || !webhookUrl}
                className="btn-primary w-full"
              >
                {isLoading ? 'Testing...' : 'Test Webhook'}
              </button>
            </div>
          </div>

          {/* User Webhook Settings */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Webhook Settings</h2>
            
            <button
              onClick={loadUserWebhooks}
              className="btn-secondary mb-4"
            >
              Load My Webhook Settings
            </button>

            <div className="text-sm text-gray-400">
              <p>This will show your current webhook configuration and constructed URLs.</p>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-dark-900 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Debugging Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-200">Debugging Tips</h2>
          <div className="space-y-2 text-sm text-blue-100">
            <p><strong>405 Error:</strong> Your webhook endpoint doesn't accept POST requests or doesn't exist</p>
            <p><strong>404 Error:</strong> Webhook URL is incorrect or endpoint doesn't exist</p>
            <p><strong>500 Error:</strong> Server error on your webhook endpoint</p>
            <p><strong>Network Error:</strong> Can't reach the webhook URL (check if it's accessible)</p>
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
              <p className="font-semibold text-yellow-200">n8n Webhook Issues:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li><strong>404 "not registered":</strong> Activate your n8n workflow (toggle in top-right)</li>
                <li><strong>Use production URL:</strong> Not test URL (production = /webhook/, test = /webhook-test/)</li>
                <li><strong>Check webhook path:</strong> Must match n8n webhook node configuration</li>
                <li><strong>Workflow must be active:</strong> Only active workflows accept production webhooks</li>
              </ul>
            </div>
            
            <p><strong>Common Issues:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Make sure your webhook endpoint accepts POST requests</li>
              <li>Check if your webhook endpoint is publicly accessible</li>
              <li>Verify the URL is correct (no typos)</li>
              <li>Test with a simple webhook service like webhook.site</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
