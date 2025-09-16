'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketIcon, ClockIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface Ticket {
  id: string
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'new' | 'in_progress' | 'completed'
  created_at: string
  created_by_user: {
    full_name: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      const [myTicketsResponse, allTicketsResponse] = await Promise.all([
        fetch('/api/tickets/my-tickets'),
        fetch('/api/tickets/all')
      ])
      
      const [myTicketsData, allTicketsData] = await Promise.all([
        myTicketsResponse.json(),
        allTicketsResponse.json()
      ])
      
      // Ensure data is an array before calling slice
      setMyTickets(Array.isArray(myTicketsData) ? myTicketsData.slice(0, 5) : [])
      setAllTickets(Array.isArray(allTicketsData) ? allTicketsData.slice(0, 10) : [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'badge-critical'
      case 'high': return 'badge-high'
      case 'medium': return 'badge-medium'
      case 'low': return 'badge-low'
      default: return 'badge-low'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'badge-new'
      case 'in_progress': return 'badge-in-progress'
      case 'completed': return 'badge-completed'
      default: return 'badge-new'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="h-4 bg-dark-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-dark-700 rounded w-1/4"></div>
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Welcome back! Here's an overview of your tickets and activity.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-600 rounded-lg">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">My Active Tickets</p>
                <p className="text-2xl font-bold text-white">
                  {myTickets.filter(t => t.status !== 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-white">
                  {myTickets.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {myTickets.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/create-ticket')}
              className="flex items-center justify-center p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <TicketIcon className="h-6 w-6 mr-2" />
              Create Ticket
            </button>
            <button
              onClick={() => router.push('/my-tickets')}
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <TicketIcon className="h-6 w-6 mr-2" />
              My Tickets
            </button>
            <button
              onClick={() => router.push('/inbox')}
              className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <EnvelopeIcon className="h-6 w-6 mr-2" />
              Inbox
            </button>
            <button
              onClick={() => router.push('/completed')}
              className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              Completed
            </button>
          </div>
        </div>

        {/* My Recent Tickets */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">My Recent Tickets</h2>
          {myTickets.length === 0 ? (
            <p className="text-gray-400">No tickets assigned to you yet.</p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{ticket.title}</h3>
                    <p className="text-sm text-gray-400">
                      Created by {ticket.created_by_user?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getUrgencyColor(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                    <span className={`badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Recent Tickets */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          {allTickets.length === 0 ? (
            <p className="text-gray-400">No tickets in the system yet.</p>
          ) : (
            <div className="space-y-3">
              {allTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{ticket.title}</h3>
                    <p className="text-sm text-gray-400">
                      Created by {ticket.created_by_user?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getUrgencyColor(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                    <span className={`badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
