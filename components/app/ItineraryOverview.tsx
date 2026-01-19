'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Map,
  Clock,
  Route,
  DollarSign,
  AlertCircle,
  Edit,
  Download,
  Wifi,
  WifiOff,
  ArrowLeft,
  Share2,
  Copy,
  Check,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Day } from '@/types'

export default function ItineraryOverview() {
  const router = useRouter()
  const { itinerary, currentTrip, selectedLocations, setItinerary } = useAppStore()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['1']))
  const [isOffline, setIsOffline] = useState(false)
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set())
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingDayId, setEditingDayId] = useState<string | null>(null)

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

  const handleDownload = () => {
    if (!currentTrip && itinerary.length === 0) {
      alert('Nothing to download yet. Please generate an itinerary first.')
      return
    }

    const data = {
      trip: currentTrip,
      itinerary: days,
      exportedAt: new Date().toISOString(),
    }

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const destinationSlug =
        currentTrip?.destination
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'itinerary'

      a.href = url
      a.download = `${destinationSlug}-${currentTrip?.days || days.length}-days-itinerary.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      // Mark as downloaded / offline-ready in the UI
      setDownloadedItems(new Set(['itinerary']))
      setIsOffline(true)
    } catch (error) {
      console.error('Failed to download itinerary:', error)
      alert('Failed to download itinerary. Please try again.')
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
    if (!currentTrip || itinerary.length === 0) {
      alert('Please create an itinerary first')
      return
    }

    setIsSharing(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip: currentTrip,
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
    } catch (error) {
      console.error('Error sharing itinerary:', error)
      alert('Failed to share itinerary. Please try again.')
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
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link. Please copy it manually.')
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
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
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
              onClick={() => router.push('/app/map')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Map className="w-5 h-5" />
              View on Map
            </button>
          </div>
        </div>

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

        {downloadedItems.size > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <Download className="w-4 h-4" />
              <span className="font-semibold">Downloaded for offline use:</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Array.from(downloadedItems).map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs capitalize"
                >
                  {item}
                </span>
              ))}
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
