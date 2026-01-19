'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { MapPin, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function WelcomeBanner() {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if user has dismissed the banner before (using localStorage)
  const [hasSeenBanner, setHasSeenBanner] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sololo-welcome-dismissed') === 'true'
  })

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sololo-welcome-dismissed', 'true')
    }
  }

  const handleGoogleSignIn = () => {
    // In a real app, this would trigger Google Sign-In
    handleDismiss()
    // Could navigate to auth or just dismiss
  }

  if (hasSeenBanner || isDismissed) {
    return null
  }

  return (
    <m.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 sm:p-6 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Welcome to Sololo
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Your AI travel companion that helps you plan trips, explore optimized routes, and connect with fellow travelers.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGoogleSignIn}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Continue with Google
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Skip for now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </m.div>
  )
}
