'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { CreateTicketModal } from '@/components/CreateTicketModal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function CreateTicketPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to sent tickets page after successful creation
    router.push('/sent-tickets')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Ticket</h1>
            <p className="text-gray-400">Create a new ticket to assign to team members</p>
          </div>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <PlusIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Create a New Ticket</h3>
            <p className="text-gray-400 mb-6">
              Click the button below to create a new ticket with all the necessary details
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Ticket
            </button>
          </div>
        </div>

        <CreateTicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  )
}
