'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('HomePage: Auth state changed - loading:', loading, 'user:', user ? 'logged in' : 'not logged in')
    if (!loading) {
      if (user) {
        console.log('HomePage: Redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.log('HomePage: Redirecting to login')
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
    </div>
  )
}
