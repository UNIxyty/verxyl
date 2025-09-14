'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'

interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    tertiary: string
    accent: string
  }
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Professional Dark',
    description: 'Clean, modern dark theme with excellent readability',
    colors: {
      primary: '#0f0f0f',
      secondary: '#1a1a1a',
      tertiary: '#262626',
      accent: '#3b82f6'
    }
  },
  {
    id: 'light',
    name: 'Modern Light',
    description: 'Clean, professional light theme',
    colors: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#3b82f6'
    }
  },
  {
    id: 'light-blue',
    name: 'Azure',
    description: 'Sophisticated light theme with blue accents',
    colors: {
      primary: '#fefefe',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#0ea5e9'
    }
  },
  {
    id: 'dark-ocean',
    name: 'Deep Professional',
    description: 'Professional dark blue theme for focused work',
    colors: {
      primary: '#0a0e1a',
      secondary: '#1a1f2e',
      tertiary: '#252b3d',
      accent: '#0ea5e9'
    }
  },
  {
    id: 'dark-forest',
    name: 'GitHub Professional',
    description: 'GitHub-inspired dark theme with blue accents',
    colors: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d',
      accent: '#58a6ff'
    }
  },
  {
    id: 'dark-galaxy',
    name: 'Sophisticated Purple',
    description: 'Elegant dark theme with purple accents',
    colors: {
      primary: '#0f0b1e',
      secondary: '#1a1625',
      tertiary: '#252131',
      accent: '#8b5cf6'
    }
  },
  {
    id: 'dark-fire',
    name: 'Warm Professional',
    description: 'Professional dark theme with warm red accents',
    colors: {
      primary: '#1a0f0f',
      secondary: '#2a1f1f',
      tertiary: '#3a2f2f',
      accent: '#ef4444'
    }
  },
  {
    id: 'dark-sunset',
    name: 'Elegant Orange',
    description: 'Professional dark theme with orange accents',
    colors: {
      primary: '#1a140f',
      secondary: '#2a241f',
      tertiary: '#3a342f',
      accent: '#f97316'
    }
  },
  {
    id: 'light-mint',
    name: 'Clean Green',
    description: 'Professional light theme with green accents',
    colors: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#10b981'
    }
  },
  {
    id: 'light-rose',
    name: 'Subtle Pink',
    description: 'Professional light theme with pink accents',
    colors: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#ec4899'
    }
  },
  {
    id: 'dark-cyber',
    name: 'Modern Matrix',
    description: 'Futuristic dark theme with neon green accents',
    colors: {
      primary: '#000000',
      secondary: '#0d1117',
      tertiary: '#161b22',
      accent: '#00ff88'
    }
  },
  {
    id: 'light-gold',
    name: 'Professional Gold',
    description: 'Professional light theme with gold accents',
    colors: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#f59e0b'
    }
  }
]

interface ThemePickerProps {
  currentTheme: string
  onThemeChange: (themeId: string) => void
}

export function ThemePicker({ currentTheme, onThemeChange }: ThemePickerProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme)
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    setSelectedTheme(currentTheme)
    // Determine current mode based on selected theme
    if (currentTheme.startsWith('light')) {
      setMode('light')
    } else {
      setMode('dark')
    }
  }, [currentTheme])

  const handleModeToggle = (newMode: 'dark' | 'light') => {
    setMode(newMode)
    // Auto-select first theme of the new mode
    const availableThemes = themes.filter(theme => 
      newMode === 'light' ? theme.id.startsWith('light') : theme.id.startsWith('dark') || theme.id === 'default'
    )
    if (availableThemes.length > 0) {
      const firstTheme = availableThemes[0]
      setSelectedTheme(firstTheme.id)
      onThemeChange(firstTheme.id)
    }
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    onThemeChange(themeId)
  }

  const filteredThemes = themes.filter(theme => 
    mode === 'light' ? theme.id.startsWith('light') : theme.id.startsWith('dark') || theme.id === 'default'
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Choose Your Theme</h3>
        <p className="text-gray-400 text-sm">Select your preferred mode and customize your experience</p>
      </div>

      {/* Mode Toggle Switch */}
      <div className="bg-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-white mb-1">Display Mode</h4>
            <p className="text-sm text-gray-400">Choose between light and dark modes</p>
          </div>
          
          <div className="flex items-center bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => handleModeToggle('dark')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                mode === 'dark'
                  ? 'bg-theme-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MoonIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => handleModeToggle('light')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                mode === 'light'
                  ? 'bg-theme-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <SunIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white flex items-center">
            {mode === 'dark' ? (
              <>
                <MoonIcon className="h-5 w-5 mr-2 text-theme-primary" />
                Dark Themes
              </>
            ) : (
              <>
                <SunIcon className="h-5 w-5 mr-2 text-theme-primary" />
                Light Themes
              </>
            )}
          </h4>
          <span className="text-sm text-gray-400">
            {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''} available
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((theme) => (
            <ThemeCard 
              key={theme.id} 
              theme={theme} 
              selectedTheme={selectedTheme} 
              onSelect={handleThemeSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ theme, selectedTheme, onSelect }: { 
  theme: Theme, 
  selectedTheme: string, 
  onSelect: (id: string) => void 
}) {
  return (
    <div
      onClick={() => onSelect(theme.id)}
      className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        selectedTheme === theme.id
          ? 'border-theme-primary shadow-2xl shadow-theme-primary/30 ring-2 ring-theme-primary/20'
          : 'border-gray-600 hover:border-gray-500 hover:shadow-lg'
      }`}
    >
      {/* Enhanced Theme Preview */}
      <div className="p-4 rounded-t-xl" style={{ backgroundColor: theme.colors.primary }}>
        <div className="space-y-3">
          {/* Header bar with gradient */}
          <div className="flex items-center space-x-2">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: theme.colors.accent, opacity: 0.7 }}
            />
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: theme.colors.accent, opacity: 0.4 }}
            />
          </div>
          
          {/* Content area with more detail */}
          <div 
            className="h-10 rounded-lg flex items-center px-3"
            style={{ backgroundColor: theme.colors.secondary }}
          >
            <div 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <div className="flex-1 space-y-1">
              <div 
                className="h-1 rounded w-3/4"
                style={{ backgroundColor: theme.colors.tertiary }}
              />
              <div 
                className="h-1 rounded w-1/2"
                style={{ backgroundColor: theme.colors.tertiary, opacity: 0.6 }}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <div 
              className="h-6 rounded-md flex-1"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <div 
              className="h-6 w-12 rounded-md"
              style={{ backgroundColor: theme.colors.tertiary }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Theme Info */}
      <div className="p-4 bg-dark-700 rounded-b-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">{theme.name}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{theme.description}</p>
          </div>
          {selectedTheme === theme.id && (
            <div className="ml-3 flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-theme-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
