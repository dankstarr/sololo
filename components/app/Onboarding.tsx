'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, X } from 'lucide-react'

export default function Onboarding() {
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(true)

  if (!showOnboarding) {
    router.push('/app/home')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center relative z-10">
        <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Sololo
        </h1>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Your AI travel companion that helps you plan trips, explore optimized
          routes, and connect with fellow travelers.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => {
              // In a real app, this would trigger Google Sign-In
              router.push('/app/home')
            }}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            Continue with Google
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push('/app/home')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
