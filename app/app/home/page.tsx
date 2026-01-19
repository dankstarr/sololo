'use client'

import TripCreation from '@/components/app/TripCreation'
import { useAppStore } from '@/store/useAppStore'
import { getThemeById } from '@/config/themes'

export default function HomePage() {
  const { currentTheme } = useAppStore()
  const theme = getThemeById(currentTheme || 'default')

  return (
    <div className={`min-h-screen ${theme.gradient}`}>
      <div className="container mx-auto px-6 py-8">
        <TripCreation />
      </div>
    </div>
  )
}
