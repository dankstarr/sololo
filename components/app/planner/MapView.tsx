'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Share2,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import LocationDetail from '../LocationDetail'
import { SimpleMap } from '@/components/maps'
import { FilterPanel, DaySelector, OfflineIndicator } from '@/components/common'
import { Button, Drawer, DrawerContent, Input } from '@/components/ui'
import { openInGoogleMaps, createGoogleMapsList } from '@/lib/utils'
import { googleMaps } from '@/config/google-maps'
import { useOffline } from '@/hooks'
import { useAppStore } from '@/store/useAppStore'
import { savePageAsPDF } from '@/lib/utils/pdf'
import { Location, Day, TripFormData } from '@/types'

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
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set())
  const [showLocationsList, setShowLocationsList] = useState(true)
  const [showAllDays, setShowAllDays] = useState(true) // Show all days by default
  const [currentItineraryShareUrl, setCurrentItineraryShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedItineraryId, setCopiedItineraryId] = useState<string | null>(null)
  const [expandedItineraries, setExpandedItineraries] = useState<Set<string>>(new Set())
  const [deletingItineraryId, setDeletingItineraryId] = useState<string | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)
  // Preserve original itinerary data when loading shared itineraries
  const [originalItinerary, setOriginalItinerary] = useState<Day[]>([])
  const [originalTrip, setOriginalTrip] = useState<TripFormData | null>(null)
  const [originalLocations, setOriginalLocations] = useState<Location[]>([])

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
      
      // Preserve original itinerary data before loading shared one
      if (activeItineraryKey === 'current') {
        setOriginalTrip(currentTrip)
        setOriginalLocations(selectedLocations)
        setOriginalItinerary(itinerary)
      }
      
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
        router.replace(`/app/map?${params.toString()}`, { scroll: false })
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
    // Restore original itinerary data if we have it preserved
    if (originalItinerary.length > 0) {
      setItinerary(originalItinerary)
    }
    if (originalTrip) {
      setCurrentTrip(originalTrip)
    }
    if (originalLocations.length > 0) {
      setSelectedLocations(originalLocations)
    }
    
    setActiveItineraryKey('current')
    setSelectedDay(1)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.delete('itineraryId')
      const qs = params.toString()
      router.replace(qs ? `/app/map?${qs}` : '/app/map', { scroll: false })
    }

    setMobileItineraryDrawerOpen(false)
    // Auto-generate share link for current itinerary if needed
    void ensureCurrentItineraryShareLink()
  }

  // Auto-generate share link for current itinerary
  const ensureCurrentItineraryShareLink = async () => {
    // Only create if we have itinerary data and no share URL yet
    if (currentItineraryShareUrl || !itinerary || itinerary.length === 0) return

    setIsSharing(true)
    try {
      const tripToShare =
        currentTrip ||
        {
          destination: 'Your Trip',
          days: String(itinerary.length),
          dates: {
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + itinerary.length * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          },
          travelMode: 'walking',
          pace: 'balanced',
          interests: [],
          accessibility: false,
        }

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip: tripToShare,
          locations: selectedLocations,
          itinerary: itinerary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to share itinerary')
      }

      const data = await response.json()
      const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${data.shareUrl}`
      setCurrentItineraryShareUrl(fullUrl)
      
      // Update URL with the share ID for unique link
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.set('itineraryId', data.shareId)
        router.replace(`/app/map?${params.toString()}`, { scroll: false })
      }
    } catch (error) {
      console.error('Error creating share link:', error)
      // Don't show error banner - this is a background operation
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!currentItineraryShareUrl) return

    try {
      await navigator.clipboard.writeText(currentItineraryShareUrl)
      setCopied(true)
      addBanner('success', 'Share link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      addBanner('error', 'Failed to copy link. Please copy it manually.')
    }
  }

  const handleCopyItineraryLink = async (itineraryId: string) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/discover/share/${itineraryId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedItineraryId(itineraryId)
      addBanner('success', 'Share link copied to clipboard!')
      setTimeout(() => setCopiedItineraryId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      addBanner('error', 'Failed to copy link. Please copy it manually.')
    }
  }

  const toggleItineraryExpanded = (itineraryId: string) => {
    setExpandedItineraries((prev) => {
      const next = new Set(prev)
      if (next.has(itineraryId)) {
        next.delete(itineraryId)
      } else {
        next.add(itineraryId)
      }
      return next
    })
  }

  const handleDeleteItinerary = async (itineraryId: string) => {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return
    }

    setDeletingItineraryId(itineraryId)
    setShowActionsMenu(null)
    
    try {
      const res = await fetch(`/api/share?id=${encodeURIComponent(itineraryId)}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete itinerary')
      
      addBanner('success', 'Itinerary deleted successfully')
      await loadSharedList()
      
      // If deleted itinerary was active, switch to current
      if (activeItineraryKey === itineraryId) {
        selectCurrentItinerary()
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error)
      addBanner('error', 'Failed to delete itinerary. Please try again.')
    } finally {
      setDeletingItineraryId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Initialize original data from store on mount
  useEffect(() => {
    if (itinerary.length > 0 && originalItinerary.length === 0) {
      setOriginalItinerary(itinerary)
    }
    if (currentTrip && !originalTrip) {
      setOriginalTrip(currentTrip)
    }
    if (selectedLocations.length > 0 && originalLocations.length === 0) {
      setOriginalLocations(selectedLocations)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionsMenu && !(event.target as Element).closest('.relative')) {
        setShowActionsMenu(null)
      }
    }
    
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  useEffect(() => {
    void loadSharedList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!itineraryIdParam) {
      // No itinerary ID in URL - show current itinerary and ensure it has a share link
      if (activeItineraryKey !== 'current') {
        setActiveItineraryKey('current')
      }
      if (itinerary && itinerary.length > 0) {
        void ensureCurrentItineraryShareLink()
      }
      return
    }
    if (activeItineraryKey === itineraryIdParam) return
    void loadSharedItinerary(itineraryIdParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryIdParam])

  // Sync with current itinerary when it changes
  useEffect(() => {
    if (activeItineraryKey === 'current' && itinerary && itinerary.length > 0) {
      // Update original data when current itinerary changes
      setOriginalItinerary(itinerary)
      if (currentTrip) setOriginalTrip(currentTrip)
      if (selectedLocations.length > 0) setOriginalLocations(selectedLocations)
      void ensureCurrentItineraryShareLink()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, currentTrip, selectedLocations])

  // Convert itinerary days to map format
  const days = useMemo(() => {
    return itinerary.length > 0 
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
  }, [itinerary, selectedLocations])

  const filteredShared = useMemo(() => {
    const q = itinerarySearch.trim().toLowerCase()
    if (!q) return sharedItineraries
    return sharedItineraries.filter((s) => {
      const dest = String(s?.trip?.destination || '').toLowerCase()
      const id = String(s?.id || '').toLowerCase()
      return dest.includes(q) || id.includes(q)
    })
  }, [itinerarySearch, sharedItineraries])

  // Helper function to check if a category matches the filters
  const categoryMatchesFilter = useCallback((category?: string): boolean => {
    if (!category) return true // Show locations without category if any filter is enabled
    
    const cat = category.toLowerCase()
    
    // Check if location category matches any enabled filter
    const isFood = cat.includes('restaurant') || cat.includes('food') || cat.includes('dining')
    const isCulture = cat.includes('museum') || cat.includes('art') || cat.includes('culture') || cat.includes('temple') || cat.includes('shrine') || cat.includes('landmark')
    const isScenic = cat.includes('park') || cat.includes('nature') || cat.includes('scenic') || cat.includes('view') || cat.includes('beach') || cat.includes('mountain')
    
    // Return true if the category matches an enabled filter
    if (isFood && filters.food) return true
    if (isCulture && filters.culture) return true
    if (isScenic && filters.scenic) return true
    
    // If no filters match, check if all filters are disabled (show all)
    const anyFilterEnabled = filters.food || filters.culture || filters.scenic
    if (!anyFilterEnabled) return true
    
    return false
  }, [filters])

  // Get all locations from all days with day information
  const allDaysLocations = useMemo(() => {
    const allLocs: Array<{
      name: string
      category: string
      lat: number
      lng: number
      day: number
      dayName: string
      estimatedTime?: string
      distance?: string
      pace?: string
      notes?: string
      budget?: string
    }> = []
    
    days.forEach((day) => {
      day.locations.forEach((loc) => {
        const location = selectedLocations.find((l) => l.name === loc.name)
        const dayData = itinerary.find((d) => d.day === day.id)
        allLocs.push({
          name: loc.name,
          category: location?.category || 'culture',
          lat: location?.lat || 35.6762,
          lng: location?.lng || 139.6503,
          day: day.id,
          dayName: day.name,
          estimatedTime: dayData?.estimatedTime,
          distance: dayData?.distance,
          pace: dayData?.pace,
          notes: dayData?.notes,
          budget: dayData?.budget,
        })
      })
    })
    
    return allLocs
  }, [days, selectedLocations, itinerary])

  // Get current day locations (for sidebar display) - also apply filters
  const currentDayLocations = useMemo(() => {
    let locations: typeof allDaysLocations = []
    
    if (showAllDays) {
      // Show all locations from all days
      locations = allDaysLocations
    } else {
      if (!selectedDay) return []
      // Filter by selected day from allDaysLocations
      locations = allDaysLocations.filter((loc) => loc.day === selectedDay)
    }
    
    // Apply category filters
    let filtered = locations.filter((loc) => categoryMatchesFilter(loc.category))
    
    // Apply selection filters (if locations are manually selected/unselected)
    if (selectedLocationIds.size > 0) {
      filtered = filtered.filter((loc) => selectedLocationIds.has(loc.name))
    }
    
    return filtered
  }, [selectedDay, showAllDays, allDaysLocations, selectedLocationIds, categoryMatchesFilter])

  // Filter locations based on selection state and category filters
  const filteredMapLocations = useMemo(() => {
    // If showing all days, use allDaysLocations, otherwise filter by selected day
    const allLocations = showAllDays
      ? allDaysLocations
      : (selectedDay
          ? allDaysLocations.filter((loc) => loc.day === selectedDay)
          : allDaysLocations.filter((loc) => loc.day === days[0]?.id))
    
    // Apply category filters
    let filtered = allLocations.filter((loc) => categoryMatchesFilter(loc.category))
    
    // Apply selection filters (if locations are manually selected/unselected)
    if (selectedLocationIds.size > 0) {
      filtered = filtered.filter((loc) => selectedLocationIds.has(loc.name))
    }
    
    return filtered
  }, [selectedDay, days, selectedLocationIds, showAllDays, allDaysLocations, categoryMatchesFilter])

  // Toggle location selection
  const toggleLocationSelection = (locationName: string) => {
    setSelectedLocationIds((prev) => {
      const next = new Set(prev)
      if (next.has(locationName)) {
        next.delete(locationName)
      } else {
        next.add(locationName)
      }
      return next
    })
  }

  // Get category color mapping
  const getCategoryColor = (category?: string) => {
    const c = (category || 'culture').toLowerCase()
    if (c.includes('restaurant') || c.includes('food')) return '#dc2626' // red
    if (c.includes('park') || c.includes('nature') || c.includes('scenic')) return '#16a34a' // green
    if (c.includes('museum') || c.includes('art') || c.includes('culture')) return '#2563eb' // blue
    return '#6b7280' // gray default
  }

  const getCategoryLabel = (category?: string) => {
    const c = (category || 'culture').toLowerCase()
    if (c.includes('restaurant') || c.includes('food')) return 'Food'
    if (c.includes('park') || c.includes('nature') || c.includes('scenic')) return 'Scenic'
    if (c.includes('museum') || c.includes('art') || c.includes('culture')) return 'Culture'
    return 'Other'
  }

  return (
    <div className="flex w-full h-[calc(100vh-4rem)]">
      {/* Left Pane (Desktop) */}
      <aside className="hidden lg:flex w-80 shrink-0 border-r border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="w-full p-4 flex flex-col gap-4 h-full overflow-hidden">
          {/* Tabs for Itineraries and Locations */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setShowLocationsList(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                !showLocationsList
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Itineraries
            </button>
            <button
              onClick={() => setShowLocationsList(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                showLocationsList
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Locations ({currentDayLocations.length})
            </button>
          </div>

          {showLocationsList ? (
            /* Locations List */
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col">
              {/* Toggle for showing all days */}
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">View Mode</label>
                <button
                  onClick={() => setShowAllDays(!showAllDays)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    showAllDays
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showAllDays ? 'All Days' : `Day ${selectedDay || 1}`}
                </button>
              </div>
              
              <div className="space-y-2 flex-1">
                {currentDayLocations.length === 0 ? (
                  <div className="text-xs text-gray-500 p-3 border border-dashed border-gray-200 rounded-xl text-center">
                    No locations {showAllDays ? 'available' : 'for selected day'}
                  </div>
                ) : (
                  currentDayLocations.map((location, index) => {
                    const isSelected = selectedLocationIds.has(location.name)
                    const categoryColor = getCategoryColor(location.category)
                    const categoryLabel = getCategoryLabel(location.category)
                    
                    return (
                      <div
                        key={`${location.name}-${index}-${location.day || ''}`}
                        onClick={() => toggleLocationSelection(location.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: categoryColor }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {location.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                              )}
                            </div>
                            {location.dayName && (
                              <div className="mb-1.5">
                                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                  {location.dayName}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: categoryColor }}
                              >
                                {categoryLabel}
                              </span>
                              {location.estimatedTime && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  ⏱ {location.estimatedTime}
                                </span>
                              )}
                              {location.distance && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  📍 {location.distance}
                                </span>
                              )}
                            </div>
                            {location.notes && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {location.notes}
                              </p>
                            )}
                            {location.budget && (
                              <p className="text-xs text-gray-700 font-medium mt-1">
                                💰 {location.budget}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* Itineraries List */
            <>
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

              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                <div className="space-y-2">
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
                  
                  {/* Share link for current itinerary */}
                  {activeItineraryKey === 'current' && currentItineraryShareUrl && (
                    <div className="p-3 rounded-xl border border-primary-200 bg-primary-50">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-semibold text-primary-900 flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Share Link
                        </div>
                        <button
                          onClick={handleCopyShareLink}
                          className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-700 transition-all"
                          aria-label="Copy share link"
                        >
                          {copied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-primary-700 break-all font-mono">
                        {currentItineraryShareUrl}
                      </p>
                    </div>
                  )}
                  
                  {activeItineraryKey === 'current' && isSharing && (
                    <div className="p-2 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Creating share link...
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Shared / Recent</div>
                  {filteredShared.length === 0 ? (
                    <div className="text-xs text-gray-500 p-3 border border-dashed border-gray-200 rounded-xl">
                      No shared itineraries found yet.
                    </div>
                  ) : (
                    filteredShared.map((s) => {
                      const isExpanded = expandedItineraries.has(s.id)
                      const isDeleting = deletingItineraryId === s.id
                      const showMenu = showActionsMenu === s.id
                      
                      return (
                        <div
                          key={s.id}
                          className={`rounded-xl border transition-all ${
                            activeItineraryKey === s.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          } ${isDeleting ? 'opacity-50' : ''}`}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                onClick={() => void loadSharedItinerary(s.id)}
                                className="flex-1 text-left min-w-0"
                              >
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {s.trip?.destination || 'Shared itinerary'}
                                </div>
                                <div className="text-xs text-gray-600 truncate mt-1">
                                  {s.trip?.days ? `${s.trip.days} days` : '—'} • {formatDate(s.createdAt)}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Eye className="w-3 h-3" />
                                    {s.views ?? 0} views
                                  </div>
                                  {s.itinerary?.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {s.itinerary.length} {s.itinerary.length === 1 ? 'day' : 'days'}
                                    </div>
                                  )}
                                  {s.locations?.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {s.locations.length} {s.locations.length === 1 ? 'location' : 'locations'}
                                    </div>
                                  )}
                                </div>
                              </button>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleItineraryExpanded(s.id)
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowActionsMenu(showMenu ? null : s.id)
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                    aria-label="More actions"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  
                                  {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCopyItineraryLink(s.id)
                                          setShowActionsMenu(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        {copiedItineraryId === s.id ? (
                                          <>
                                            <Check className="w-4 h-4 text-green-600" />
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-4 h-4" />
                                            Copy link
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteItinerary(s.id)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        disabled={isDeleting}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                {s.trip?.dates?.start && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(s.trip.dates.start).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                      {s.trip.dates.end && (
                                        <>
                                          {' - '}
                                          {new Date(s.trip.dates.end).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                )}
                                {s.trip?.interests && Array.isArray(s.trip.interests) && s.trip.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {s.trip.interests.map((interest: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyItineraryLink(s.id)
                                    }}
                                    className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all flex items-center gap-1.5"
                                  >
                                    {copiedItineraryId === s.id ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Link copied!
                                      </>
                                    ) : (
                                      <>
                                        <Share2 className="w-3 h-3" />
                                        Copy share link
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Map Area */}
      <div className="relative flex-1">
        {/* Back Button + Mobile Itinerary Button */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
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
              locations={filteredMapLocations}
              selectedDay={showAllDays ? undefined : (selectedDay || 1)}
              onLocationClick={(location) => {
                // Find which day this location belongs to
                const locationWithDay = allDaysLocations.find((l) => l.name === location.name)
                const day = locationWithDay 
                  ? days.find((d) => d.id === locationWithDay.day)
                  : (selectedDay ? days.find((d) => d.id === selectedDay) : days[0])
                const loc = day?.locations.find((l) => l.name === location.name)
                setSelectedLocation({
                  name: location.name,
                  category: loc?.category || locationWithDay?.category || 'culture',
                })
              }}
              showRoute={false}
              routeColor={googleMaps.routeColor}
              travelMode={currentTrip?.travelMode === 'mixed' ? 'driving' : (currentTrip?.travelMode || 'walking')}
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
          <div className="flex flex-wrap gap-4 ml-0 lg:ml-48">
            <OfflineIndicator />
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <button
                onClick={() => {
                  setShowAllDays(true)
                  setSelectedDay(null)
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                  showAllDays
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Days
              </button>
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => {
                    setShowAllDays(false)
                    setSelectedDay(day.id)
                  }}
                  className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                    !showAllDays && selectedDay === day.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              size="medium"
              icon={<Filter className="w-5 h-5" />}
              className="min-w-[44px]"
            />
          </div>
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
                    // Get travel mode from current trip, default to 'walking'
                    const travelMode = currentTrip?.travelMode || 'walking'
                    // Map 'mixed' to 'driving' for Google Maps
                    const googleMapsMode = travelMode === 'mixed' ? 'driving' : travelMode
                    
                    const url = createGoogleMapsList(
                      currentDay.locations.map((loc: any) => ({ 
                        name: loc.name || loc, 
                        lat: loc.lat, 
                        lng: loc.lng 
                      })),
                      googleMapsMode as 'walking' | 'driving' | 'bicycling' | 'transit'
                    )
                    if (url) {
                      window.open(url, '_blank')
                      addBanner(
                        'success',
                        `Opening ${currentDay.locations.length} location${currentDay.locations.length > 1 ? 's' : ''} in Google Maps with ${travelMode} mode...`
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
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="text-xs text-gray-600">Food</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563eb' }}></div>
              <span className="text-xs text-gray-600">Culture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
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
                    filteredShared.map((s) => {
                      const isExpanded = expandedItineraries.has(s.id)
                      const isDeleting = deletingItineraryId === s.id
                      const showMenu = showActionsMenu === s.id
                      
                      return (
                        <div
                          key={s.id}
                          className={`rounded-xl border transition-all ${
                            activeItineraryKey === s.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          } ${isDeleting ? 'opacity-50' : ''}`}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                onClick={() => void loadSharedItinerary(s.id)}
                                className="flex-1 text-left min-w-0"
                              >
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {s.trip?.destination || 'Shared itinerary'}
                                </div>
                                <div className="text-xs text-gray-600 truncate mt-1">
                                  {s.trip?.days ? `${s.trip.days} days` : '—'} • {formatDate(s.createdAt)}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Eye className="w-3 h-3" />
                                    {s.views ?? 0} views
                                  </div>
                                </div>
                              </button>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleItineraryExpanded(s.id)
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowActionsMenu(showMenu ? null : s.id)
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                    aria-label="More actions"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  
                                  {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCopyItineraryLink(s.id)
                                          setShowActionsMenu(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        {copiedItineraryId === s.id ? (
                                          <>
                                            <Check className="w-4 h-4 text-green-600" />
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-4 h-4" />
                                            Copy link
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteItinerary(s.id)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        disabled={isDeleting}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                {s.trip?.dates?.start && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(s.trip.dates.start).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                      {s.trip.dates.end && (
                                        <>
                                          {' - '}
                                          {new Date(s.trip.dates.end).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                )}
                                {s.trip?.interests && Array.isArray(s.trip.interests) && s.trip.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {s.trip.interests.map((interest: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyItineraryLink(s.id)
                                    }}
                                    className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all flex items-center gap-1.5"
                                  >
                                    {copiedItineraryId === s.id ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Link copied!
                                      </>
                                    ) : (
                                      <>
                                        <Share2 className="w-3 h-3" />
                                        Copy share link
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
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
