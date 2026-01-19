'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Map,
  Filter,
  ExternalLink,
  List,
  FileText,
  ArrowLeft,
  RefreshCw,
  PanelLeft,
  X,
  CheckCircle2,
  Info,
  AlertCircle,
} from 'lucide-react'
import LocationDetail from './LocationDetail'
import { SimpleMap } from '@/components/maps'
import { FilterPanel, DaySelector, OfflineIndicator } from '@/components/common'
import { Button, Drawer, DrawerContent, Input } from '@/components/ui'
import { openInGoogleMaps, createGoogleMapsList } from '@/lib/utils'
import { googleMaps } from '@/config/google-maps'
import { useOffline } from '@/hooks'
import { useAppStore } from '@/store/useAppStore'
import { savePageAsPDF } from '@/lib/utils/pdf'

interface BannerMessage {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
}

interface SharedItineraryRow {
  id: string
  trip: any
  locations: any[]
  itinerary: any[]
  createdAt: number
  views: number
}

export default function MapView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itineraryIdParam = searchParams.get('itineraryId')
  const {
    itinerary,
    selectedLocations,
    currentTrip,
    setCurrentTrip,
    setSelectedLocations,
    setItinerary,
  } = useAppStore()
  const [selectedDay, setSelectedDay] = useState<number | null>(1)
  const [filters, setFilters] = useState({
    food: true,
    culture: true,
    scenic: true,
  })
  const [showFilters, setShowFilters] = useState(false)
  const isOffline = useOffline()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string
    category: string
  } | null>(null)
  const [banners, setBanners] = useState<BannerMessage[]>([])

  const [sharedItineraries, setSharedItineraries] = useState<SharedItineraryRow[]>([])
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(false)
  const [activeItineraryKey, setActiveItineraryKey] = useState<string>('current')
  const [itinerarySearch, setItinerarySearch] = useState('')
  const [mobileItineraryDrawerOpen, setMobileItineraryDrawerOpen] = useState(false)

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

  const loadSharedList = async () => {
    setIsLoadingItineraries(true)
    try {
      const res = await fetch('/api/share/list')
      if (!res.ok) throw new Error('Failed to load itineraries')
      const data = (await res.json()) as SharedItineraryRow[]
      setSharedItineraries(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load shared itineraries:', e)
      setSharedItineraries([])
    } finally {
      setIsLoadingItineraries(false)
    }
  }

  const loadSharedItinerary = async (shareId: string) => {
    if (!shareId) return
    try {
      addBanner('info', 'Loading itinerary…')
      const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
      if (!res.ok) throw new Error('Failed to load itinerary')
      const data = await res.json()

      if (data?.trip) setCurrentTrip(data.trip)
      if (Array.isArray(data?.locations)) setSelectedLocations(data.locations)
      if (Array.isArray(data?.itinerary)) setItinerary(data.itinerary)

      setSelectedDay(1)
      setActiveItineraryKey(shareId)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.set('itineraryId', shareId)
        router.replace(`/app/map?${params.toString()}`)
      }

      addBanner('success', 'Itinerary loaded on map.')
    } catch (e) {
      console.error('Failed to load shared itinerary:', e)
      addBanner('error', 'Failed to load itinerary. Please try again.')
    } finally {
      setMobileItineraryDrawerOpen(false)
    }
  }

  const selectCurrentItinerary = () => {
    setActiveItineraryKey('current')
    setSelectedDay(1)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.delete('itineraryId')
      const qs = params.toString()
      router.replace(qs ? `/app/map?${qs}` : '/app/map')
    }

    setMobileItineraryDrawerOpen(false)
  }

  useEffect(() => {
    void loadSharedList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!itineraryIdParam) return
    if (activeItineraryKey === itineraryIdParam) return
    void loadSharedItinerary(itineraryIdParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryIdParam])

  // Convert itinerary days to map format
  const days = itinerary.length > 0 
    ? itinerary.map((day, index) => ({
        id: day.day,
        name: `Day ${day.day}`,
        color: index % 2 === 0 ? 'bg-blue-500' : 'bg-green-500',
        locations: day.locations.map(locName => {
          const location = selectedLocations.find(l => l.name === locName)
          return {
            name: locName,
            category: location?.category || 'culture',
            lat: location?.lat || 35.6762,
            lng: location?.lng || 139.6503,
          }
        }),
      }))
    : [
        {
          id: 1,
          name: 'Day 1',
          color: 'bg-blue-500',
          locations: [
            { name: 'Senso-ji Temple', category: 'culture', lat: 35.7148, lng: 139.7967 },
            { name: 'Tsukiji Market', category: 'food', lat: 35.6654, lng: 139.7706 },
            { name: 'Tokyo Skytree', category: 'scenic', lat: 35.7101, lng: 139.8107 },
          ],
        },
        {
          id: 2,
          name: 'Day 2',
          color: 'bg-green-500',
          locations: [
            { name: 'Shibuya Crossing', category: 'culture', lat: 35.6598, lng: 139.7006 },
            { name: 'Meiji Shrine', category: 'culture', lat: 35.6764, lng: 139.6993 },
            { name: 'Harajuku', category: 'culture', lat: 35.6702, lng: 139.7026 },
          ],
        },
      ]

  const filteredShared = useMemo(() => {
    const q = itinerarySearch.trim().toLowerCase()
    if (!q) return sharedItineraries
    return sharedItineraries.filter((s) => {
      const dest = String(s?.trip?.destination || '').toLowerCase()
      const id = String(s?.id || '').toLowerCase()
      return dest.includes(q) || id.includes(q)
    })
  }, [itinerarySearch, sharedItineraries])

  return (
    <div className="flex w-full h-[calc(100vh-4rem)]">
      {/* Left Pane (Desktop) */}
      <aside className="hidden lg:flex w-80 shrink-0 border-r border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="w-full p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Itineraries</h2>
            <button
              onClick={() => void loadSharedList()}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              aria-label="Refresh itineraries"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingItineraries ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <Input
            value={itinerarySearch}
            onChange={(e) => setItinerarySearch(e.target.value)}
            placeholder="Search by destination or id…"
            className="rounded-xl"
          />

          <div className="space-y-2 overflow-y-auto pr-1">
            <button
              onClick={selectCurrentItinerary}
              className={`w-full text-left p-3 rounded-xl border transition-all hover-lift ${
                activeItineraryKey === 'current'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">Current itinerary</div>
              <div className="text-xs text-gray-600">
                {currentTrip?.destination ? currentTrip.destination : 'Not set'} • {days.length} days
              </div>
            </button>

            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-500 mb-2">Shared / Recent</div>
              {filteredShared.length === 0 ? (
                <div className="text-xs text-gray-500 p-3 border border-dashed border-gray-200 rounded-xl">
                  No shared itineraries found yet.
                </div>
              ) : (
                filteredShared.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => void loadSharedItinerary(s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all hover-lift ${
                      activeItineraryKey === s.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {s.trip?.destination || 'Shared itinerary'}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {s.trip?.days ? `${s.trip.days} days` : '—'} • id: {s.id}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 shrink-0">{s.views ?? 0} views</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Map Area */}
      <div className="relative flex-1">
        {/* Back Button + Mobile Itinerary Button */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => router.push('/app/itinerary')}
            className="bg-white rounded-lg shadow-lg px-3 md:px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs md:text-sm font-medium hidden sm:inline">Back to Itinerary</span>
            <span className="text-xs md:text-sm font-medium sm:hidden">Back</span>
          </button>

          <button
            onClick={() => setMobileItineraryDrawerOpen(true)}
            className="lg:hidden bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-all"
            aria-label="Open itineraries"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Itineraries</span>
          </button>
        </div>

        {/* Google Map */}
        {googleMaps.enabled && googleMaps.apiKey ? (
          <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
            <SimpleMap
              locations={
                selectedDay
                  ? days.find((d) => d.id === selectedDay)?.locations || []
                  : days[0]?.locations || []
              }
              selectedDay={selectedDay || 1}
              onLocationClick={(location) =>
                setSelectedLocation({
                  name: location.name,
                  category: 'culture',
                })
              }
              showRoute={false}
              routeColor={googleMaps.routeColor}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-100 to-blue-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Google Maps integration would appear here</p>
                <p className="text-gray-500 text-sm mt-2">Configure Google Maps API key in .env.local</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-4">
          <OfflineIndicator />
          <DaySelector
            days={days.map((d) => ({ id: d.id, name: d.name }))}
            selectedDay={selectedDay}
            onDaySelect={(dayId) => setSelectedDay(typeof dayId === 'string' ? parseInt(dayId, 10) : dayId)}
          />
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            size="medium"
            icon={<Filter className="w-5 h-5" />}
            className="min-w-[44px]"
          />
        </div>

        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
        />

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  const currentDay = days.find((d) => d.id === selectedDay)
                  if (currentDay && currentDay.locations.length > 0) {
                    const firstLocation = currentDay.locations[0]
                    openInGoogleMaps({
                      name: firstLocation.name,
                      lat: firstLocation.lat,
                      lng: firstLocation.lng,
                    })
                  } else {
                    openInGoogleMaps({ name: 'Tokyo, Japan' })
                  }
                }}
                fullWidth
                icon={<ExternalLink className="w-4 h-4 md:w-5 md:h-5" />}
              >
                <span className="hidden sm:inline">Open in Google Maps</span>
                <span className="sm:hidden">Google Maps</span>
              </Button>
              <Button
                onClick={() => {
                  const currentDay = days.find((d) => d.id === selectedDay)
                  if (currentDay && currentDay.locations.length > 0) {
                    const url = createGoogleMapsList(currentDay.locations)
                    if (url) {
                      window.open(url, '_blank')
                      addBanner(
                        'success',
                        `Opening ${currentDay.locations.length} location${currentDay.locations.length > 1 ? 's' : ''} in Google Maps...`
                      )
                    } else {
                      addBanner('error', 'No locations available to create a Google Maps list.')
                    }
                  } else {
                    addBanner('error', 'No locations available for the selected day.')
                  }
                }}
                variant="outline"
                fullWidth
                icon={<List className="w-4 h-4 md:w-5 md:h-5" />}
              >
                <span className="hidden sm:inline">Create Google Maps List</span>
                <span className="sm:hidden">Create List</span>
              </Button>
            </div>
            <Button
              onClick={async () => {
                setIsGeneratingPDF(true)
                try {
                  const filename = `map-view-${new Date().toISOString().split('T')[0]}.pdf`
                  await savePageAsPDF(filename)
                  addBanner('success', 'Map view saved as PDF successfully!')
                } catch (error) {
                  console.error('Failed to save PDF:', error)
                  addBanner('error', 'Failed to save PDF. Please try again.')
                } finally {
                  setIsGeneratingPDF(false)
                }
              }}
              variant="secondary"
              fullWidth
              icon={<FileText className="w-4 h-4 md:w-5 md:h-5" />}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? 'Generating PDF...' : 'Save as PDF'}
            </Button>
          </div>
        </div>

        {/* Color Legend */}
        <div className="absolute bottom-24 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Categories</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Food</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Culture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Scenic</span>
            </div>
          </div>
        </div>

        {/* Banner Messages */}
        {banners.length > 0 && (
          <div className="absolute top-4 left-4 right-4 z-30 space-y-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`animate-fade-in-up rounded-lg p-4 flex items-start justify-between gap-4 shadow-lg ${
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

        {/* Location Detail Modal */}
        {selectedLocation && (
          <LocationDetail
            location={{
              name: selectedLocation.name,
              description: `Explore ${selectedLocation.name}, a ${selectedLocation.category} destination with rich history and culture.`,
              openingHours: '9:00 AM - 6:00 PM',
              address: 'Tokyo, Japan',
              crowdEstimate: 'Moderate',
              safetyNotes: 'Generally safe area. Watch for pickpockets in crowded areas.',
              photos: [],
            }}
            onClose={() => setSelectedLocation(null)}
          />
        )}

        {/* Mobile Itinerary Drawer */}
        <Drawer open={mobileItineraryDrawerOpen} onOpenChange={setMobileItineraryDrawerOpen} side="left">
          <DrawerContent onClose={() => setMobileItineraryDrawerOpen(false)}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Itineraries</h2>
                <button
                  onClick={() => void loadSharedList()}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  aria-label="Refresh itineraries"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoadingItineraries ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <Input
                value={itinerarySearch}
                onChange={(e) => setItinerarySearch(e.target.value)}
                placeholder="Search by destination or id…"
                className="rounded-xl"
              />

              <div className="space-y-2">
                <button
                  onClick={selectCurrentItinerary}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeItineraryKey === 'current'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">Current itinerary</div>
                  <div className="text-xs text-gray-600">
                    {currentTrip?.destination ? currentTrip.destination : 'Not set'} • {days.length} days
                  </div>
                </button>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Shared / Recent</div>
                  {filteredShared.length === 0 ? (
                    <div className="text-xs text-gray-500 p-3 border border-dashed border-gray-200 rounded-xl">
                      No shared itineraries found yet.
                    </div>
                  ) : (
                    filteredShared.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => void loadSharedItinerary(s.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          activeItineraryKey === s.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{s.trip?.destination || 'Shared itinerary'}</div>
                        <div className="text-xs text-gray-600">
                          {s.trip?.days ? `${s.trip.days} days` : '—'} • id: {s.id} • {s.views ?? 0} views
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
