'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { AuthUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        setUser(session?.user as AuthUser || null)
        setLoading(false)
      } catch (error) {
        console.error('Exception getting session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setUser(session?.user as AuthUser || null)
        setLoading(false)
      }
    )

    // Handle page visibility changes (tab switching)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing auth state...')
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.error('Error refreshing session on visibility change:', error)
          } else {
            console.log('Session refreshed on visibility change:', session?.user?.id)
            setUser(session?.user as AuthUser || null)
          }
        } catch (error) {
          console.error('Exception refreshing session on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const signIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      
      const supabase = createClient()
      
      // Sign out from Supabase
      console.log('Calling Supabase signOut...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase sign out error:', error)
      } else {
        console.log('Supabase sign out successful')
      }
      
      // Clear all cookies manually (Chrome compatibility)
      console.log('Clearing authentication cookies...')
      const cookies = document.cookie.split(';')
      let clearedCookies = 0
      
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name && (name.includes('supabase') || name.includes('sb-') || name.includes('auth'))) {
          console.log(`Clearing cookie: ${name}`)
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          document.cookie = `${name}=; Path=/; Domain=.${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          clearedCookies++
        }
      }
      
      console.log(`Cleared ${clearedCookies} authentication cookies`)
      
      // Clear localStorage and sessionStorage
      console.log('Clearing local and session storage...')
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear user state immediately
      setUser(null)
      
      console.log('Redirecting to login page...')
      
      // Use a small delay to ensure state is cleared before redirect
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
      
    } catch (error) {
      console.error('Sign out error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      
      // Clear user state even if there's an error
      setUser(null)
      
      // Fallback: force redirect to login
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
