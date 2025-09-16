'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { 
  FolderIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Modal } from '@/components/Modal'
import { UserSelector } from '@/components/UserSelector'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  created_by: string
  assigned_to: string | null
  deadline: string | null
  budget: number | null
  progress: number
  created_at: string
  updated_at: string
  completed_at: string | null
  created_by_user: User
  assigned_user: User | null
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    deadline: '',
    budget: '',
    priority: 'medium'
  })

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Project title is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assigned_to: formData.assigned_to || null,
          deadline: formData.deadline || null,
          budget: formData.budget ? parseFloat(formData.budget) : null
        })
      })

      if (response.ok) {
        toast.success('Project created successfully!')
        setFormData({ title: '', description: '', assigned_to: '', deadline: '', budget: '', priority: 'medium' })
        onCreated()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Project" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input w-full"
            placeholder="Enter project title..."
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="textarea w-full"
            placeholder="Enter project description..."
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign To
            </label>
            <UserSelector
              value={formData.assigned_to}
              onChange={(value) => setFormData({ ...formData, assigned_to: value as string })}
              placeholder="Select user..."
              disabled={loading}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="input w-full"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="input w-full"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-mobile"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary btn-mobile"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects?limit=50')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        toast.error('Failed to load projects')
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-primary'
      case 'completed': return 'badge-success'
      case 'on_hold': return 'badge-warning'
      case 'cancelled': return 'badge-danger'
      default: return 'badge-low'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'badge-low'
      case 'medium': return 'badge-medium'
      case 'high': return 'badge-high'
      case 'urgent': return 'badge-critical'
      default: return 'badge-low'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ClockIcon className="h-4 w-4" />
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'on_hold': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'cancelled': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'No budget set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage your projects and track progress
            </p>
          </div>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center btn-mobile"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Project
          </button>
        </div>

        <div className="card">
          <div className="p-4 sm:p-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No projects found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="card card-responsive"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`badge ${getStatusColor(project.status)} flex items-center gap-1`}>
                              {getStatusIcon(project.status)}
                              {project.status}
                            </span>
                            <span className={`badge ${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </span>
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-gray-300 mb-3 text-sm sm:text-base">{project.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
                          <div>
                            <span className="font-medium">Created by:</span> {project.created_by_user?.full_name || project.created_by_user?.email || 'Unknown'}
                          </div>
                          <div>
                            <span className="font-medium">Assigned to:</span> {project.assigned_user?.full_name || project.assigned_user?.email || 'Unassigned'}
                          </div>
                          <div>
                            <span className="font-medium">Deadline:</span> {formatDate(project.deadline)}
                          </div>
                          <div>
                            <span className="font-medium">Budget:</span> {formatCurrency(project.budget)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                        <button className="btn-secondary flex items-center text-sm btn-mobile">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button className="btn-secondary flex items-center text-sm btn-mobile">
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <CreateProjectModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={loadProjects}
        />
      </div>
    </DashboardLayout>
  )
}
