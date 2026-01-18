'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function UpgradePage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-gray-600 mb-8">
            Unlock unlimited trips, offline features, and priority support.
          </p>
          <div className="bg-primary-50 rounded-xl p-6 mb-8">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              $9.99
              <span className="text-lg text-gray-600 font-normal">/month</span>
            </div>
            <ul className="text-left space-y-2 mt-6">
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Unlimited trips</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Offline audio & maps</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Advanced routing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Priority groups</span>
              </li>
            </ul>
          </div>
          <button className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all">
            Subscribe to Pro
          </button>
        </div>
      </div>
    </div>
  )
}
