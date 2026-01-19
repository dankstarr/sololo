'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Map,
  Clock,
  Route,
  DollarSign,
  AlertCircle,
  Edit,
  FileText,
  Wifi,
  WifiOff,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Navigation,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Day } from '@/types'
import { createCircularGoogleMapsRoute } from '@/lib/utils/location'
import { savePageAsPDF } from '@/lib/utils/pdf'
import { trackedFetch } from '@/lib/utils/tracked-fetch'

interface BannerMessage {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
}

export default function ItineraryOverview() {
  const router = useRouter()
  const { itinerary, currentTrip, selectedLocations, setItinerary } = useAppStore()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['1']))
  const [isOffline, setIsOffline] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [banners, setBanners] = useState<BannerMessage[]>([])

  // Use itinerary from store or fallback to default
  const days: Day[] = itinerary.length > 0 ? itinerary : [
    {
      id: '1',
      day: 1,
      locations: ['Senso-ji Temple', 'Tsukiji Outer Market', 'Tokyo Skytree'],
      estimatedTime: '6-8 hours',
      distance: '5.2 km',
      pace: 'balanced',
      notes: 'Start early to avoid crowds at Senso-ji',
      budget: '$50-80',
    },
    {
      id: '2',
      day: 2,
      locations: ['Shibuya Crossing', 'Meiji Shrine', 'Harajuku'],
      estimatedTime: '7-9 hours',
      distance: '4.8 km',
      pace: 'rushed',
      notes: 'This day feels rushed — want to relax it?',
      budget: '$60-90',
    },
    {
      id: '3',
      day: 3,
      locations: ['TeamLab Borderless', 'Odaiba'],
      estimatedTime: '4-5 hours',
      distance: '3.1 km',
      pace: 'relaxed',
      notes: 'Book TeamLab tickets in advance',
      budget: '$40-60',
    },
  ]

  const addBanner = (type: 'error' | 'success' | 'info', message: string) => {
    const id = Date.now().toString()
    setBanners((prev) => [...prev, { id, type, message }])
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setBanners((prev) => prev.filter((b) => b.id !== id))
    }, 5000)
  }

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id))
  }

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayId)) {
        next.delete(dayId)
      } else {
        next.add(dayId)
      }
      return next
    })
  }

  const handleSaveAsPDF = async () => {
    if (!currentTrip && itinerary.length === 0) {
      addBanner('error', 'Nothing to save yet. Please generate an itinerary first.')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const destinationSlug =
        currentTrip?.destination
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'itinerary'
      const filename = `${destinationSlug}-${currentTrip?.days || days.length}-days-itinerary.pdf`
      
      // Get the main content container (the div with max-w-4xl)
      const contentElement = document.querySelector('.container.mx-auto.px-6.py-8 .max-w-4xl') as HTMLElement
      await savePageAsPDF(filename, contentElement || undefined)
      setIsOffline(true)
      addBanner('success', 'Itinerary saved as PDF successfully!')
    } catch (error) {
      console.error('Failed to save PDF:', error)
      addBanner('error', 'Failed to save PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const moveLocation = (dayId: string, index: number, direction: 'up' | 'down') => {
    const source = itinerary.length > 0 ? itinerary : days
    const updated = source.map((d) => ({ ...d, locations: [...(d.locations || [])] }))
    const dayIndex = updated.findIndex((d) => d.id === dayId)
    if (dayIndex === -1) return

    const locs = updated[dayIndex].locations || []
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= locs.length) return

    const newLocs = [...locs]
    ;[newLocs[index], newLocs[newIndex]] = [newLocs[newIndex], newLocs[index]]
    updated[dayIndex] = { ...updated[dayIndex], locations: newLocs }
    setItinerary(updated)
  }

  const handleShare = async () => {
    // Allow sharing as long as we have some days to share (even if store.itinerary is empty fallback)
    const hasDays = days && days.length > 0
    if (!hasDays) {
      addBanner('error', 'Please create an itinerary first')
      return
    }

    // If trip is missing (e.g., user landed directly on this page), create a minimal stub
    const tripToShare =
      currentTrip ||
      {
        destination: 'Your Trip',
        days: String(days.length),
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + days.length * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
        interests: [],
        travelMode: 'walking',
        pace: 'balanced',
        accessibility: false,
      }

    setIsSharing(true)
    try {
      const response = await trackedFetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip: tripToShare,
          locations: selectedLocations,
          itinerary: days,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to share itinerary')
      }

      const data = await response.json()
      const fullUrl = `${window.location.origin}${data.shareUrl}`
      setShareUrl(fullUrl)
      addBanner('success', 'Shareable link created!')
    } catch (error) {
      console.error('Error sharing itinerary:', error)
      addBanner('error', 'Failed to share itinerary. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addBanner('success', 'Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      addBanner('error', 'Failed to copy link. Please copy it manually.')
    }
  }

  const handleOpenInGoogleMaps = () => {
    // Prefer selectedLocations with coordinates; fall back to names from itinerary
    const baseLocations =
      selectedLocations && selectedLocations.length > 0
        ? selectedLocations
        : Array.from(
            new Set(
              days.flatMap((d) => d.locations || [])
            )
          ).map((name) => ({ name }))

    if (!baseLocations || baseLocations.length === 0) {
      addBanner('error', 'No locations available to open in Google Maps yet.')
      return
    }

    try {
      const url = createCircularGoogleMapsRoute(
        baseLocations.map((loc) => ({
          name: loc.name,
          lat: (loc as any).lat,
          lng: (loc as any).lng,
          address: (loc as any).address,
        }))
      )
      
      if (typeof window !== 'undefined') {
        window.open(url, '_blank')
        addBanner('success', `Opening ${baseLocations.length} location${baseLocations.length > 1 ? 's' : ''} in Google Maps...`)
      }
    } catch (error) {
      console.error('Failed to open Google Maps:', error)
      addBanner('error', 'Failed to open Google Maps. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Your Itinerary
            </h1>
            {currentTrip && (
              <p className="text-lg text-gray-600">
                {currentTrip.destination} • {currentTrip.days} days
              </p>
            )}
            <p className="text-gray-600">Tokyo, Japan • 3 days</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              {isOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-700">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Online</span>
                </>
              )}
            </div>
            <button
              onClick={handleSaveAsPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Save as PDF'}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
            <button
              onClick={handleOpenInGoogleMaps}
              className="px-4 py-2 bg-white text-primary border border-primary rounded-lg font-semibold hover:bg-primary/5 transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Open in Google Maps
            </button>
            <button
              onClick={() => router.push('/app/map')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Map className="w-5 h-5" />
              View on Map
            </button>
          </div>
        </div>

        {/* Banner Messages */}
        {banners.length > 0 && (
          <div className="mb-6 space-y-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`animate-fade-in-up rounded-lg p-4 flex items-start justify-between gap-4 ${
                    banner.type === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : banner.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {banner.type === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : banner.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        banner.type === 'error'
                          ? 'text-red-900'
                          : banner.type === 'success'
                          ? 'text-green-900'
                          : 'text-blue-900'
                      }`}
                    >
                      {banner.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBanner(banner.id)}
                    className={`flex-shrink-0 ${
                      banner.type === 'error'
                        ? 'text-red-600 hover:text-red-800'
                        : banner.type === 'success'
                        ? 'text-green-600 hover:text-green-800'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

        {shareUrl && (
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary mb-1">Shareable Link Created!</p>
                <p className="text-xs text-gray-600 break-all">{shareUrl}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all flex items-center gap-2 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}


        <div className="space-y-4 mb-8">
          {days.map((day) => {
            const isExpanded = expandedDays.has(day.id)
            return (
              <div
                key={day.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleDay(day.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {day.day}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Day {day.day}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {day.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Route className="w-4 h-4" />
                          {day.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {day.budget}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {day.pace === 'rushed' && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Rushed
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 animate-in fade-in duration-300">
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Locations
                        </h4>
                        <ul className="space-y-2">
                          {day.locations?.map((location, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                {idx + 1}
                              </span>
                              {location}
                              {editingDayId === day.id && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => moveLocation(day.id, idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveLocation(day.id, idx, 'down')}
                                    disabled={idx === (day.locations?.length || 0) - 1}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {day.notes && (
                        <div className="bg-primary-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{day.notes}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          defaultValue={day.notes}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          rows={3}
                          placeholder="Add your personal notes for this day..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDayId((current) => (current === day.id ? null : day.id))
                          }
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          {editingDayId === day.id ? 'Done' : 'Edit Order'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            AI Suggestions
          </h3>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <p className="text-gray-700">
              <strong>Day 2 feels rushed</strong> — want to relax it? Consider
              removing one location or extending your stay.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
