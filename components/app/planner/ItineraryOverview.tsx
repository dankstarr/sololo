'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Map,
  FileText,
  Wifi,
  WifiOff,
  ArrowLeft,
  Share2,
  Navigation,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Day, TripFormData } from '@/types'
import { createCircularGoogleMapsRoute } from '@/lib/utils/location'
import { savePageAsPDF } from '@/lib/utils/pdf'
import { trackedFetch } from '@/lib/utils/api/tracked-fetch'
import CollaboratorsPanel from '../CollaboratorsPanel'
import EditHistoryPanel from '../EditHistoryPanel'
import { enrichTripData } from '@/lib/utils/itinerary'
import type { BannerMessage } from './itinerary-overview/BannerMessages'
import { BannerMessages } from './itinerary-overview/BannerMessages'
import { ShareableLinkCard } from './itinerary-overview/ShareableLinkCard'
import { AISuggestionsSection } from './itinerary-overview/AISuggestionsSection'
import { DaysGrid } from './itinerary-overview/DaysGrid'
import { availableInterests } from './itinerary-overview/available-interests'
import { TripDetailsSection } from './itinerary-overview/TripDetailsSection'

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
  const [tripDetailsExpanded, setTripDetailsExpanded] = useState(false)
  const [enrichedInfoTab, setEnrichedInfoTab] = useState<'overview' | 'practical' | 'cultural'>('overview')
  const [aiSuggestionsExpanded, setAiSuggestionsExpanded] = useState(true)

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
    const url =
      shareUrl ||
      (typeof window !== 'undefined' && currentShareId
        ? `${window.location.origin}/discover/share/${currentShareId}`
        : null)
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
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
    <div className="w-full px-4 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
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

        <BannerMessages banners={banners} onRemove={removeBanner} />

        <ShareableLinkCard
          shareUrl={shareUrl}
          currentShareId={currentShareId}
          copied={copied}
          onCopy={handleCopyLink}
        />

        {tripFormData && (
          <TripDetailsSection
            tripFormData={tripFormData}
            setTripFormData={(next) => setTripFormData(next)}
            tripDetailsExpanded={tripDetailsExpanded}
            setTripDetailsExpanded={setTripDetailsExpanded}
            editingTripDetails={editingTripDetails}
            setEditingTripDetails={setEditingTripDetails}
            enrichedInfoTab={enrichedInfoTab}
            setEnrichedInfoTab={setEnrichedInfoTab}
            availableInterests={[...availableInterests]}
            onSave={handleSaveTripDetails}
            onCancel={handleCancelEditTrip}
          />
        )}
        <AISuggestionsSection
          days={days}
          selectedLocations={selectedLocations}
          tripFormData={tripFormData}
          expanded={aiSuggestionsExpanded}
          onToggle={() => setAiSuggestionsExpanded(!aiSuggestionsExpanded)}
        />

        <DaysGrid
          days={days}
          expandedDays={expandedDays}
          toggleDay={toggleDay}
          editingDayId={editingDayId}
          setEditingDayId={setEditingDayId}
          selectedLocations={selectedLocations}
          moveLocation={moveLocation}
          removeLocation={removeLocation}
          addLocationToDay={addLocationToDay}
        />
        </div>
        {/* Sidebar: Collaborators and Edit History / Trip Insights */}
        <div className="lg:col-span-1 space-y-6">
          {currentShareId ? (
            <>
              <CollaboratorsPanel
                itineraryId={currentShareId}
                currentUserId={userProfile?.id}
              />
              <EditHistoryPanel itineraryId={currentShareId} />
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-4 text-sm text-gray-700 space-y-2">
              <p className="font-semibold text-gray-900">Trip collaboration</p>
              <p>
                Share your itinerary to invite friends, track edit history, and collaborate in real time.
              </p>
              <p className="text-xs text-gray-500">
                Once you generate a share link, this panel will show collaborators and recent changes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
