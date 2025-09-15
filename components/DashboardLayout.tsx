'use client'

import { useAuth } from './AuthProvider'
import { Navigation } from './Navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])


  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      <Navigation />
      <main className="lg:ml-56 pt-16 lg:pt-0 max-w-full overflow-x-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
