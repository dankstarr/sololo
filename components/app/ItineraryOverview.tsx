'use client'

import { useState, useEffect } from 'react'
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
  MapPin,
  Calendar,
  Heart,
  Gauge,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Day, TripFormData } from '@/types'
import { createCircularGoogleMapsRoute } from '@/lib/utils/location'
import { savePageAsPDF } from '@/lib/utils/pdf'
import { trackedFetch } from '@/lib/utils/tracked-fetch'
import CollaboratorsPanel from './CollaboratorsPanel'
import EditHistoryPanel from './EditHistoryPanel'
import { enrichTripData } from '@/lib/utils/itinerary-enrichment'

interface BannerMessage {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
}

export default function ItineraryOverview() {
  const router = useRouter()
  const { itinerary, currentTrip, selectedLocations, setItinerary, setCurrentTrip, currentShareId, setCurrentShareId, userProfile } = useAppStore()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['1']))
  const [isOffline, setIsOffline] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [editingTripDetails, setEditingTripDetails] = useState(false)
  const [tripFormData, setTripFormData] = useState<TripFormData | null>(null)
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

  const moveLocation = async (dayId: string, index: number, direction: 'up' | 'down') => {
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
    
    // Update shared itinerary if it exists
    if (currentShareId && currentTrip) {
      try {
        const previousState = { itinerary: source }
        await trackedFetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareId: currentShareId,
            trip: currentTrip,
            locations: selectedLocations,
            itinerary: updated,
            userId: userProfile?.id,
            actionType: 'location_moved',
            details: {
              dayId,
              locationIndex: index,
              direction,
              locationName: locs[index],
            },
            previousState,
          }),
        })
      } catch (e) {
        console.warn('Failed to update shared itinerary:', e)
      }
    }
  }

  const removeLocation = async (dayId: string, index: number) => {
    const source = itinerary.length > 0 ? itinerary : days
    const updated = source.map((d) => ({ ...d, locations: [...(d.locations || [])] }))
    const dayIndex = updated.findIndex((d) => d.id === dayId)
    if (dayIndex === -1) return

    const newLocs = [...(updated[dayIndex].locations || [])]
    newLocs.splice(index, 1)
    updated[dayIndex] = { ...updated[dayIndex], locations: newLocs }
    setItinerary(updated)
    
    // Update shared itinerary if it exists
    if (currentShareId && currentTrip) {
      try {
        const removedLocation = updated[dayIndex].locations[index] || newLocs[index]
        await trackedFetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareId: currentShareId,
            trip: currentTrip,
            locations: selectedLocations,
            itinerary: updated,
            userId: userProfile?.id,
            actionType: 'location_removed',
            details: {
              dayId,
              locationIndex: index,
              locationName: removedLocation,
            },
            previousState: { itinerary: source },
          }),
        })
      } catch (e) {
        console.warn('Failed to update shared itinerary:', e)
      }
    }
    
    addBanner('success', 'Location removed from itinerary')
  }

  const addLocationToDay = async (dayId: string, locationName: string) => {
    const source = itinerary.length > 0 ? itinerary : days
    const updated = source.map((d) => ({ ...d, locations: [...(d.locations || [])] }))
    const dayIndex = updated.findIndex((d) => d.id === dayId)
    if (dayIndex === -1) return

    const newLocs = [...(updated[dayIndex].locations || [])]
    if (newLocs.includes(locationName)) {
      addBanner('info', 'Location already in this day')
      return
    }
    newLocs.push(locationName)
    updated[dayIndex] = { ...updated[dayIndex], locations: newLocs }
    setItinerary(updated)
    
    // Update shared itinerary if it exists
    if (currentShareId && currentTrip) {
      try {
        await trackedFetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareId: currentShareId,
            trip: currentTrip,
            locations: selectedLocations,
            itinerary: updated,
            userId: userProfile?.id,
            actionType: 'location_added',
            details: {
              dayId,
              locationName,
              dayNumber: updated[dayIndex].day,
            },
            previousState: { itinerary: source },
          }),
        })
      } catch (e) {
        console.warn('Failed to update shared itinerary:', e)
      }
    }
    
    addBanner('success', `Added "${locationName}" to Day ${updated[dayIndex].day}`)
  }

  // Initialize trip form data when component mounts or currentTrip changes
  useEffect(() => {
    if (currentTrip) {
      // Enrich trip data if it doesn't have enriched fields
      const enriched = currentTrip.timezone 
        ? currentTrip 
        : enrichTripData(currentTrip)
      setTripFormData(enriched)
    } else if (!tripFormData) {
      // Create default trip data if none exists
      const defaultTrip: TripFormData = {
        destination: 'Tokyo, Japan',
        days: String(days.length),
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + days.length * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        interests: [],
        travelMode: 'walking',
        pace: 'balanced',
        accessibility: false,
      }
      setTripFormData(enrichTripData(defaultTrip))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrip, days.length])

  const handleSaveTripDetails = async () => {
    if (!tripFormData) return
    
    // Ensure trip data is enriched before saving
    const enriched = tripFormData.timezone 
      ? tripFormData 
      : enrichTripData(tripFormData)
    
    setCurrentTrip(enriched)
    setEditingTripDetails(false)
    addBanner('success', 'Trip details updated successfully!')
    
    // Update shared itinerary if it exists
    if (currentShareId && enriched) {
      try {
        await trackedFetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareId: currentShareId,
            trip: enriched,
            locations: selectedLocations,
            itinerary: itinerary.length > 0 ? itinerary : days,
            userId: userProfile?.id,
            actionType: 'trip_details_updated',
            details: { destination: enriched.destination },
            previousState: { trip: currentTrip },
          }),
        })
      } catch (e) {
        console.warn('Failed to update shared itinerary:', e)
      }
    }
  }

  const handleCancelEditTrip = () => {
    if (currentTrip) {
      setTripFormData(currentTrip)
    }
    setEditingTripDetails(false)
  }

  const availableInterests = [
    { id: 'food', label: 'Food', icon: '🍽️' },
    { id: 'art', label: 'Art', icon: '🎨' },
    { id: 'history', label: 'History', icon: '🏛️' },
    { id: 'nature', label: 'Nature', icon: '🌲' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'culture', label: 'Culture', icon: '🎭' },
    { id: 'adventure', label: 'Adventure', icon: '⛰️' },
  ]

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
      // Get travel mode from current trip, default to 'walking'
      const travelMode = currentTrip?.travelMode || 'walking'
      // Map 'mixed' to 'driving' for Google Maps (mixed isn't a valid Google Maps mode)
      const googleMapsMode = travelMode === 'mixed' ? 'driving' : travelMode
      
      const url = createCircularGoogleMapsRoute(
        baseLocations.map((loc) => ({
          name: loc.name,
          lat: (loc as any).lat,
          lng: (loc as any).lng,
          address: (loc as any).address,
        })),
        googleMapsMode as 'walking' | 'driving' | 'bicycling' | 'transit'
      )
      
      if (typeof window !== 'undefined') {
        window.open(url, '_blank')
        addBanner('success', `Opening ${baseLocations.length} location${baseLocations.length > 1 ? 's' : ''} in Google Maps with ${travelMode} mode...`)
      }
    } catch (error) {
      console.error('Failed to open Google Maps:', error)
      addBanner('error', 'Failed to open Google Maps. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
            {tripFormData && (
              <p className="text-lg text-gray-600">
                {tripFormData.destination} • {tripFormData.days} days
              </p>
            )}
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

        {/* Always show shareable link if it exists */}
        {(shareUrl || currentShareId) && (
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary mb-1">Shareable Link</p>
                <p className="text-xs text-gray-600 break-all">
                  {shareUrl || (typeof window !== 'undefined' ? `${window.location.origin}/discover/share/${currentShareId}` : '')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Share this link with friends to let them view your itinerary
                </p>
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

        {/* Trip Details Section */}
        {tripFormData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Trip Details</h2>
              {!editingTripDetails && (
                <button
                  onClick={() => setEditingTripDetails(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {editingTripDetails ? (
              <div className="space-y-4">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={tripFormData.destination}
                    onChange={(e) =>
                      setTripFormData({ ...tripFormData, destination: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Enter destination"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tripFormData.days}
                    onChange={(e) =>
                      setTripFormData({ ...tripFormData, days: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tripFormData.dates.start}
                      onChange={(e) =>
                        setTripFormData({
                          ...tripFormData,
                          dates: { ...tripFormData.dates, start: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tripFormData.dates.end}
                      onChange={(e) =>
                        setTripFormData({
                          ...tripFormData,
                          dates: { ...tripFormData.dates, end: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map((interest) => {
                      const isSelected = tripFormData.interests.includes(interest.id)
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => {
                            const newInterests = isSelected
                              ? tripFormData.interests.filter((i) => i !== interest.id)
                              : [...tripFormData.interests, interest.id]
                            setTripFormData({ ...tripFormData, interests: newInterests })
                          }}
                          className={`px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary-100 border-primary-300 text-primary-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-1">{interest.icon}</span>
                          {interest.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Travel Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Travel Mode
                  </label>
                  <div className="flex gap-3">
                    {(['walking', 'driving', 'mixed'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTripFormData({ ...tripFormData, travelMode: mode })}
                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                          tripFormData.travelMode === mode
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pace
                  </label>
                  <div className="flex gap-3">
                    {(['relaxed', 'balanced', 'packed'] as const).map((pace) => (
                      <button
                        key={pace}
                        type="button"
                        onClick={() => setTripFormData({ ...tripFormData, pace })}
                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                          tripFormData.pace === pace
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    checked={tripFormData.accessibility}
                    onChange={(e) =>
                      setTripFormData({ ...tripFormData, accessibility: e.target.checked })
                    }
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                  />
                  <label htmlFor="accessibility" className="text-sm font-semibold text-gray-700">
                    Accessibility requirements
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={handleSaveTripDetails}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEditTrip}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Destination</span>
                  </div>
                  <p className="text-gray-900 font-medium">{tripFormData.destination}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Duration</span>
                  </div>
                  <p className="text-gray-900 font-medium">{tripFormData.days} days</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Dates</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {new Date(tripFormData.dates.start).toLocaleDateString()} -{' '}
                    {new Date(tripFormData.dates.end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Travel Mode</span>
                  </div>
                  <p className="text-gray-900 font-medium capitalize">{tripFormData.travelMode}</p>
                </div>
                {tripFormData.interests.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Interests</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tripFormData.interests.map((interestId) => {
                        const interest = availableInterests.find((i) => i.id === interestId)
                        return interest ? (
                          <span
                            key={interestId}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                          >
                            {interest.icon} {interest.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Pace</span>
                  </div>
                  <p className="text-gray-900 font-medium capitalize">{tripFormData.pace}</p>
                </div>
                {tripFormData.accessibility && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Accessibility</span>
                    </div>
                    <p className="text-gray-900 font-medium">Enabled</p>
                  </div>
                )}
                
                {/* Enriched Trip Information */}
                {tripFormData.timezone && (
                  <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Travel Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tripFormData.timezone && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Timezone</span>
                          </div>
                          <p className="text-gray-900 font-medium">{tripFormData.timezone}</p>
                        </div>
                      )}
                      {tripFormData.currency && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Currency</span>
                          </div>
                          <p className="text-gray-900 font-medium">{tripFormData.currency}</p>
                        </div>
                      )}
                      {tripFormData.language && tripFormData.language.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Language</span>
                          </div>
                          <p className="text-gray-900 font-medium">{tripFormData.language.join(', ')}</p>
                        </div>
                      )}
                      {tripFormData.weather && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Weather</span>
                          </div>
                          <p className="text-gray-900 font-medium">{tripFormData.weather.season} • {tripFormData.weather.averageTemperature}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Emergency Contacts */}
                    {tripFormData.emergencyContacts && tripFormData.emergencyContacts.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          Emergency Contacts
                        </h4>
                        <div className="space-y-2">
                          {tripFormData.emergencyContacts.map((contact, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                <p className="text-xs text-gray-600 capitalize">{contact.type}</p>
                              </div>
                              <a href={`tel:${contact.number}`} className="text-sm font-semibold text-red-600 hover:text-red-700">
                                {contact.number}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Local Customs */}
                    {tripFormData.localCustoms && tripFormData.localCustoms.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Local Customs</h4>
                        <ul className="space-y-1">
                          {tripFormData.localCustoms.map((custom, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{custom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Cultural Etiquette */}
                    {tripFormData.culturalEtiquette && tripFormData.culturalEtiquette.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Cultural Etiquette</h4>
                        <ul className="space-y-1">
                          {tripFormData.culturalEtiquette.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Money Tips */}
                    {tripFormData.moneyTips && tripFormData.moneyTips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Money Tips</h4>
                        <ul className="space-y-1">
                          {tripFormData.moneyTips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Communication Tips */}
                    {tripFormData.communicationTips && tripFormData.communicationTips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Communication Tips</h4>
                        <ul className="space-y-1">
                          {tripFormData.communicationTips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Packing List */}
                    {tripFormData.packingList && tripFormData.packingList.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Packing Suggestions</h4>
                        <div className="flex flex-wrap gap-2">
                          {tripFormData.packingList.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Local Transportation */}
                    {tripFormData.localTransportation && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Route className="w-4 h-4 text-primary-600" />
                          Local Transportation
                        </h4>
                        {tripFormData.localTransportation.options && (
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Options:</strong> {tripFormData.localTransportation.options.join(', ')}
                          </p>
                        )}
                        {tripFormData.localTransportation.tips && (
                          <p className="text-sm text-gray-600 italic">{tripFormData.localTransportation.tips}</p>
                        )}
                        {tripFormData.localTransportation.cost && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Estimated Cost:</strong> {tripFormData.localTransportation.cost}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            Locations ({day.locations?.length || 0})
                          </h4>
                          {editingDayId === day.id && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Editing mode
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {day.locations?.map((location, idx) => (
                            <li
                              key={idx}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                editingDayId === day.id
                                  ? 'bg-gray-50 hover:bg-gray-100'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="flex-1 text-gray-700 font-medium">{location}</span>
                              {editingDayId === day.id && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveLocation(day.id, idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveLocation(day.id, idx, 'down')}
                                    disabled={idx === (day.locations?.length || 0) - 1}
                                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeLocation(day.id, idx)}
                                    className="p-2 rounded-lg bg-white border border-red-300 hover:bg-red-50 hover:border-red-400 transition-all shadow-sm"
                                    title="Remove location"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                          {(!day.locations || day.locations.length === 0) && (
                            <li className="text-gray-500 text-sm italic py-2">
                              No locations added yet
                            </li>
                          )}
                        </ul>
                        {editingDayId === day.id && selectedLocations.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Add Location
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {selectedLocations
                                .filter(
                                  (loc) => !day.locations?.includes(loc.name)
                                )
                                .map((loc) => (
                                  <button
                                    key={loc.id || loc.name}
                                    type="button"
                                    onClick={() => addLocationToDay(day.id, loc.name)}
                                    className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 border border-primary-200 transition-all font-medium"
                                  >
                                    + {loc.name}
                                  </button>
                                ))}
                              {selectedLocations.filter(
                                (loc) => !day.locations?.includes(loc.name)
                              ).length === 0 && (
                                <p className="text-xs text-gray-500 italic">
                                  All selected locations are already in this day
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Best Time to Visit */}
                      {day.bestTimeToVisit && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-900 mb-1">Best Time to Visit</p>
                              <p className="text-sm text-blue-700">{day.bestTimeToVisit}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Local Tips */}
                      {day.localTips && day.localTips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary-600" />
                            Local Tips
                          </h4>
                          <ul className="space-y-1">
                            {day.localTips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-primary-600 mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Transportation */}
                      {day.transportation && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Route className="w-4 h-4 text-primary-600" />
                            Transportation
                          </h4>
                          <div className="space-y-1 text-sm text-gray-700">
                            <p><strong>Mode:</strong> {day.transportation.mode}</p>
                            {day.transportation.cost && <p><strong>Estimated Cost:</strong> {day.transportation.cost}</p>}
                            {day.transportation.tips && <p className="text-gray-600 italic">{day.transportation.tips}</p>}
                          </div>
                        </div>
                      )}

                      {/* Photo Spots */}
                      {day.photoSpots && day.photoSpots.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Photo Spots</h4>
                          <div className="flex flex-wrap gap-2">
                            {day.photoSpots.map((spot, idx) => (
                              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                📸 {spot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Tips */}
                      {day.safetyTips && day.safetyTips.length > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Safety Tips
                          </h4>
                          <ul className="space-y-1">
                            {day.safetyTips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                                <span className="text-yellow-600 mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Cultural Notes */}
                      {day.culturalNotes && day.culturalNotes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Cultural Notes</h4>
                          <ul className="space-y-1">
                            {day.culturalNotes.map((note, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-primary-600 mt-1">•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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

        {/* Sidebar: Collaborators and Edit History */}
        <div className="lg:col-span-1 space-y-6">
          {currentShareId && (
            <>
              <CollaboratorsPanel
                itineraryId={currentShareId}
                currentUserId={userProfile?.id}
              />
              <EditHistoryPanel itineraryId={currentShareId} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
