'use client'

import { useLanguage } from '@/lib/language-context'
import { Language } from '@/lib/translations'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' }
]

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {t('language')}
      </label>
      <p className="text-sm text-gray-400 mb-3">
        {t('languageDescription')}
      </p>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="text-white">{currentLanguage?.name}</span>
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-dark-600 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  language === lang.code ? 'bg-dark-600' : ''
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-white">{lang.name}</span>
                {language === lang.code && (
                  <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
