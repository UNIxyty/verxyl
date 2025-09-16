'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  TicketIcon, 
  CogIcon, 
  LightBulbIcon, 
  FolderIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mr-3">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Verxyl</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Comprehensive Project Management System
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Manage tickets, track projects, handle invoices, and organize your AI prompts and N8N workflows all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/signup')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
              >
                Get Started
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-dark-700 hover:bg-dark-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Manage Your Projects
            </h2>
            <p className="text-gray-300 text-lg">
              A complete solution for modern project management and automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Ticket Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Ticket Management</h3>
              <p className="text-gray-300 mb-4">
                Create, assign, and track tickets with priority levels and status updates. Perfect for support teams and project management.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Priority-based organization</li>
                <li>• Real-time status tracking</li>
                <li>• Team collaboration</li>
              </ul>
            </div>

            {/* Project Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <FolderIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Project Management</h3>
              <p className="text-gray-300 mb-4">
                Organize and track your projects with detailed information, deadlines, and team assignments.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Project timelines</li>
                <li>• Team assignments</li>
                <li>• Progress tracking</li>
              </ul>
            </div>

            {/* Invoice Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Invoice Management</h3>
              <p className="text-gray-300 mb-4">
                Generate and manage invoices for your projects with client information and payment tracking.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Client management</li>
                <li>• Payment tracking</li>
                <li>• Invoice generation</li>
              </ul>
            </div>

            {/* AI Prompt Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <LightBulbIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Prompt Management</h3>
              <p className="text-gray-300 mb-4">
                Save, organize, and version your AI prompts for different models and use cases.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Multi-model support</li>
                <li>• Version control</li>
                <li>• Easy sharing</li>
              </ul>
            </div>

            {/* N8N Workflow Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <CogIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">N8N Workflow Management</h3>
              <p className="text-gray-300 mb-4">
                Backup, organize, and manage your N8N workflows with detailed information and easy access.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Workflow backup</li>
                <li>• Version management</li>
                <li>• Easy deployment</li>
              </ul>
            </div>

            {/* User Management */}
            <div className="bg-dark-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">User Management</h3>
              <p className="text-gray-300 mb-4">
                Comprehensive user management with role-based access control and approval workflows.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Role-based access</li>
                <li>• Approval workflows</li>
                <li>• Team collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of teams already using Verxyl to manage their projects more efficiently.
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
          >
            Start Your Free Trial
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
                <TicketIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Verxyl</span>
            </div>
            <p className="text-gray-400">
              © 2024 Verxyl. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}