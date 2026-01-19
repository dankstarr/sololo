'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  MapPin,
  Calendar,
  Heart,
  Navigation,
  Gauge,
  Users,
  Search,
  ArrowRight,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import WelcomeBanner from './WelcomeBanner'

export default function TripCreation() {
  const router = useRouter()
  const { itineraryCount, isPro, checkLimit, incrementItineraryCount, setCurrentTrip } = useAppStore()
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    dates: { start: '', end: '' },
    interests: [] as string[],
    travelMode: 'walking',
    pace: 'balanced',
    accessibility: false,
  })
  const [showGroupPrompt, setShowGroupPrompt] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const interests = [
    { id: 'food', label: 'Food', icon: '🍽️' },
    { id: 'art', label: 'Art', icon: '🎨' },
    { id: 'history', label: 'History', icon: '🏛️' },
    { id: 'nature', label: 'Nature', icon: '🌲' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
  ]

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user has reached the free limit
    if (!checkLimit()) {
      setShowUpgradePrompt(true)
      return
    }
    
    // Save trip data to store
    setCurrentTrip({
      destination: formData.destination,
      days: formData.days,
      dates: formData.dates,
      interests: formData.interests,
      travelMode: formData.travelMode as 'walking' | 'driving' | 'mixed',
      pace: formData.pace as 'relaxed' | 'balanced' | 'packed',
      accessibility: formData.accessibility,
    })
    
    // Generate locations via Gemini API
    try {
      // This will be handled in LocationSelection component
      incrementItineraryCount()
      router.push('/app/locations')
    } catch (error) {
      console.error('Error generating itinerary:', error)
      // Fallback to default locations
      incrementItineraryCount()
      router.push('/app/locations')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <WelcomeBanner />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Plan Your Trip
        </h1>
        <p className="text-gray-600">
          Tell us about your travel preferences and we'll create the perfect itinerary
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Destination */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Destination
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                placeholder="e.g., Tokyo, Japan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                aria-required="true"
                aria-describedby="destination-description"
              />
              <p id="destination-description" className="sr-only">Enter your travel destination</p>
            </div>

            {/* Days */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Number of Days
              </label>
              <input
                type="number"
                id="days"
                name="days"
                min="1"
                max="30"
                value={formData.days}
                onChange={(e) =>
                  setFormData({ ...formData, days: e.target.value })
                }
                placeholder="e.g., 5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                required
                aria-required="true"
                aria-describedby="days-description"
              />
              <p id="days-description" className="sr-only">Enter the number of days for your trip</p>
            </div>

            {/* Dates (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 font-semibold mb-2 block">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dates.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dates: { ...formData.dates, start: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-gray-700 font-semibold mb-2 block">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dates.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dates: { ...formData.dates, end: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                <Heart className="w-5 h-5 text-primary-600" />
                Interests
              </label>
              <div className="flex flex-wrap gap-3">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    aria-pressed={formData.interests.includes(interest.id)}
                    aria-label={`${interest.label} interest - ${formData.interests.includes(interest.id) ? 'selected' : 'not selected'}`}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] text-sm sm:text-base ${
                      formData.interests.includes(interest.id)
                        ? 'bg-primary-600 text-white shadow-lg md:scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2" aria-hidden="true">{interest.icon}</span>
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Mode */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                <Navigation className="w-5 h-5 text-primary-600" />
                Travel Mode
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {['walking', 'driving', 'mixed'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, travelMode: mode })
                    }
                    aria-pressed={formData.travelMode === mode}
                    aria-label={`Travel mode: ${mode}`}
                    className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium capitalize transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] text-sm sm:text-base ${
                      formData.travelMode === mode
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                <Gauge className="w-5 h-5 text-primary-600" />
                Pace
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {['relaxed', 'balanced', 'packed'].map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setFormData({ ...formData, pace })}
                    aria-pressed={formData.pace === pace}
                    aria-label={`Pace: ${pace}`}
                    className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium capitalize transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] text-sm sm:text-base ${
                      formData.pace === pace
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="accessibility"
                checked={formData.accessibility}
                onChange={(e) =>
                  setFormData({ ...formData, accessibility: e.target.checked })
                }
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-600"
              />
              <label
                htmlFor="accessibility"
                className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer"
              >
                <span className="w-5 h-5 text-primary-600 flex items-center justify-center" aria-label="Accessibility">♿</span>
                Accessibility needs
              </label>
            </div>
          </div>

          {/* Upgrade Prompt */}
          {showUpgradePrompt && (
            <m.div
              className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Free Limit Reached
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You've used all {itineraryCount} free itinerary generations.
                    Upgrade to Pro for unlimited trips, offline features, and
                    more!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/app/upgrade')}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Pro
                    </button>
                    <button
                      onClick={() => setShowUpgradePrompt(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </m.div>
          )}

          {/* Free Usage Counter */}
          {!isPro && !showUpgradePrompt && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Free Itineraries: {itineraryCount}/20
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {20 - itineraryCount} remaining
                  </p>
                </div>
                {itineraryCount >= 15 && (
                  <button
                    onClick={() => router.push('/app/upgrade')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-all"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Group Prompt Banner */}
          {!showGroupPrompt && (
            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Travel with others?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Do you want to create or find groups visiting this place at
                    similar dates?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/app/groups?action=create')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all text-sm"
                    >
                      Create a group
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/app/groups?action=find')}
                      className="px-4 py-2 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all text-sm"
                    >
                      Find similar groups
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGroupPrompt(true)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all text-sm"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 sm:py-4 bg-primary-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px]"
            aria-label="Generate itinerary based on your preferences"
          >
            Generate Itinerary
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    )
}
