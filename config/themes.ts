// Theme Configuration
// Popular themes for trip planning

export interface Theme {
  id: string
  name: string
  description: string
  icon: string
  colors: {
    primary: string
    secondary: string
    background: string
    accent: string
    text: string
  }
  gradient: string
  style: 'light' | 'dark' | 'vibrant' | 'elegant' | 'mysterious'
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Classic',
    description: 'Clean and modern',
    icon: '✨',
    colors: {
      primary: '#0284c7',
      secondary: '#0ea5e9',
      background: 'from-primary-50 via-white to-primary-50',
      accent: '#f59e0b',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-primary-50 via-white to-primary-50',
    style: 'light',
  },
  {
    id: 'scary-night',
    name: 'Scary Night',
    description: 'Dark and mysterious adventures',
    icon: '🌙',
    colors: {
      primary: '#1e293b',
      secondary: '#334155',
      background: 'from-slate-900 via-slate-800 to-slate-900',
      accent: '#ef4444',
      text: 'text-gray-100',
    },
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    style: 'dark',
  },
  {
    id: 'shakespeare',
    name: 'Shakespeare',
    description: 'Literary and elegant',
    icon: '📜',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      background: 'from-purple-50 via-indigo-50 to-purple-50',
      accent: '#fbbf24',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50',
    style: 'elegant',
  },
  {
    id: 'tropical',
    name: 'Tropical Paradise',
    description: 'Vibrant and sunny',
    icon: '🏝️',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      background: 'from-emerald-50 via-cyan-50 to-teal-50',
      accent: '#f59e0b',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-50',
    style: 'vibrant',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Soft and dreamy',
    icon: '💕',
    colors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      background: 'from-pink-50 via-rose-50 to-pink-50',
      accent: '#f59e0b',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50',
    style: 'elegant',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Bold and exciting',
    icon: '🏔️',
    colors: {
      primary: '#dc2626',
      secondary: '#ef4444',
      background: 'from-red-50 via-orange-50 to-yellow-50',
      accent: '#f59e0b',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
    style: 'vibrant',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Classic and timeless',
    icon: '📷',
    colors: {
      primary: '#92400e',
      secondary: '#b45309',
      background: 'from-amber-50 via-yellow-50 to-orange-50',
      accent: '#78350f',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
    style: 'elegant',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Calm and refreshing',
    icon: '🌊',
    colors: {
      primary: '#0369a1',
      secondary: '#0284c7',
      background: 'from-blue-50 via-cyan-50 to-blue-50',
      accent: '#0ea5e9',
      text: 'text-gray-900',
    },
    gradient: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50',
    style: 'light',
  },
]

export const getThemeById = (id: string): Theme => {
  return themes.find((theme) => theme.id === id) || themes[0]
}

export const defaultTheme = themes[0]
