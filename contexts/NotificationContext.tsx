'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface NotificationState {
  newTickets: number
  myTickets: number
  sentTickets: number
  completedTickets: number
  projects: number
  invoices: number
  aiPrompts: number
  n8nProjects: number
  sharedWorkflows: number
  sharedPrompts: number
}

interface NotificationContextType {
  notifications: NotificationState
  clearNotification: (key: keyof NotificationState) => void
  clearAllNotifications: () => void
  incrementNotification: (key: keyof NotificationState, amount?: number) => void
  setNotification: (key: keyof NotificationState, value: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationState>({
    newTickets: 0,
    myTickets: 0,
    sentTickets: 0,
    completedTickets: 0,
    projects: 0,
    invoices: 0,
    aiPrompts: 0,
    n8nProjects: 0,
    sharedWorkflows: 0,
    sharedPrompts: 0
  })

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`)
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications))
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
    }
  }, [user?.id])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications))
    }
  }, [notifications, user?.id])

  const clearNotification = (key: keyof NotificationState) => {
    setNotifications(prev => ({
      ...prev,
      [key]: 0
    }))
  }

  const clearAllNotifications = () => {
    setNotifications({
      newTickets: 0,
      myTickets: 0,
      sentTickets: 0,
      completedTickets: 0,
      projects: 0,
      invoices: 0,
      aiPrompts: 0,
      n8nProjects: 0,
      sharedWorkflows: 0,
      sharedPrompts: 0
    })
  }

  const incrementNotification = (key: keyof NotificationState, amount: number = 1) => {
    setNotifications(prev => ({
      ...prev,
      [key]: prev[key] + amount
    }))
  }

  const setNotification = (key: keyof NotificationState, value: number) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const value: NotificationContextType = {
    notifications,
    clearNotification,
    clearAllNotifications,
    incrementNotification,
    setNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    // Return a default context instead of throwing an error to prevent crashes
    console.warn('useNotifications called outside of NotificationProvider, returning default values')
    return {
      notifications: {
        newTickets: 0,
        myTickets: 0,
        sentTickets: 0,
        completedTickets: 0,
        projects: 0,
        invoices: 0,
        aiPrompts: 0,
        n8nProjects: 0,
        sharedWorkflows: 0,
        sharedPrompts: 0
      },
      clearNotification: () => {},
      clearAllNotifications: () => {},
      incrementNotification: () => {},
      setNotification: () => {}
    }
  }
  return context
}
