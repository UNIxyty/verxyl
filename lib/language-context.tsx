'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Language, Translations, getTranslation } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: keyof Translations) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ru')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('app-language', newLanguage)
  }

  // Translation function
  const t = (key: keyof Translations): string => {
    return getTranslation(language, key)
  }

  const value = {
    language,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
