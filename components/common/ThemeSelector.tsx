'use client'

import { Palette } from 'lucide-react'
import { themes, Theme, getThemeById } from '@/config/themes'

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (themeId: string) => void
}

export default function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  const currentTheme = getThemeById(selectedTheme)
  
  return (
    <div>
      <label className={`flex items-center gap-2 font-semibold mb-3 ${currentTheme.style === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
        <Palette className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
        Theme
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onThemeChange(theme.id)}
            aria-pressed={selectedTheme === theme.id}
            aria-label={`Theme: ${theme.name} - ${selectedTheme === theme.id ? 'selected' : 'not selected'}`}
            className={`relative px-3 sm:px-4 py-3 sm:py-4 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[60px] text-sm sm:text-base ${
              selectedTheme === theme.id
                ? 'text-white shadow-lg scale-105'
                : currentTheme.style === 'dark'
                ? 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={
              selectedTheme === theme.id
                ? {
                    backgroundColor: theme.colors.primary,
                    color: theme.style === 'dark' ? '#f1f5f9' : '#ffffff',
                    '--tw-ring-color': theme.colors.primary,
                  } as React.CSSProperties & { '--tw-ring-color': string }
                : {
                    '--tw-ring-color': currentTheme.colors.primary,
                  } as React.CSSProperties & { '--tw-ring-color': string }
            }
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg sm:text-xl" aria-hidden="true">
                {theme.icon}
              </span>
              <span className="font-semibold">{theme.name}</span>
              <span className="text-xs opacity-75 hidden sm:block">{theme.description}</span>
            </div>
            {selectedTheme === theme.id && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
