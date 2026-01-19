'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search,
  MapPin,
  Star,
  Filter,
  ArrowLeft,
  Map as MapIcon,
  ExternalLink,
  Navigation,
  X,
  Check,
  Route,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Phone,
  Clock,
  DollarSign,
  RefreshCw,
  CheckSquare,
  Square,
  Grid3x3,
  Columns,
  List,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import {
  Input,
  Badge,
  Card,
  Button,
} from '@/components/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { discoverLocations, DiscoverLocation } from '@/config/discover-locations'
import { openInGoogleMaps, createCircularGoogleMapsRoute } from '@/lib/utils/location'
import { findPlaceIdByText, geocodeAddress, getPlaceDetails, searchPlaces, getAutocompleteSuggestions } from '@/lib/api/google-maps'
import { enrichDayData, enrichTripData } from '@/lib/utils/itinerary-enrichment'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Footer from '@/components/marketing/Footer'
import { SimpleMap } from '@/components/maps'
import { useAppStore } from '@/store/useAppStore'
import { Location } from '@/types'
import { DiscoverCard } from '@/components/common'

type SortType = 'best' | 'top-rated' | 'most-reviewed' | 'hidden-gems' | 'worst-rated' | 'recently-discovered'
type FilterType = 'all' | 'current-location' | 'best' | 'top-rated' | 'hidden-gems'
type ViewMode = 'grid' | 'two-column' | 'list'

// Extended location interface with coordinates
interface LocationWithCoords extends DiscoverLocation {
  lat?: number
  lng?: number
  selected?: boolean
}

interface BannerMessage {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
}

type GooglePlaceEnrichment = NonNullable<Awaited<ReturnType<typeof getPlaceDetails>>>

export default function TopLocationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSelectedLocations, setItinerary, setCurrentTrip } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [committedSearchQuery, setCommittedSearchQuery] = useState<string>('')
  const effectiveSearchQuery = committedSearchQuery
  // Start with "All" so you always see a list on first load
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('most-reviewed')
  const [searchRadius, setSearchRadius] = useState(5) // km
  const [minReviews, setMinReviews] = useState(0)
  const [maxReviews, setMaxReviews] = useState(100000)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('My Current Location')
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set())
  const [savedLocationIds, setSavedLocationIds] = useState<Set<string>>(new Set())
  const [locationCoords, setLocationCoords] = useState<Map<string, { lat: number; lng: number }>>(new Map())
  const [banners, setBanners] = useState<BannerMessage[]>([])
  const [googleEnrichmentByLocationId, setGoogleEnrichmentByLocationId] = useState<Record<string, GooglePlaceEnrichment | null>>({})
  const [googleEnrichmentLoading, setGoogleEnrichmentLoading] = useState<Set<string>>(new Set())
  const [aroundMeLocations, setAroundMeLocations] = useState<DiscoverLocation[]>([])
  const [loadingAroundMe, setLoadingAroundMe] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ description: string; placeId: string }>>([])
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false)
  const [resultsSource, setResultsSource] = useState<'static' | 'cached' | 'live'>('static')
  const [viewMode, setViewMode] = useState<ViewMode>('two-column')

  const LONDON_CENTER = useMemo(() => ({ lat: 51.5074, lng: -0.1278 }), [])
  const AUTO_ENRICH_COUNT = 3 // Reduced from 10 to minimize API calls - only auto-enrich top 3 locations
  const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 25, 50]

  const addBanner = (type: 'error' | 'success' | 'info', message: string) => {
    const id = Date.now().toString()
    setBanners((prev) => [...prev, { id, type, message }])

    // Auto dismiss after 5s
    setTimeout(() => {
      setBanners((prev) => prev.filter((b) => b.id !== id))
    }, 5000)
  }

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id))
  }

  // Major cities list - cities that should be saved to Supabase
  const MAJOR_CITIES = useMemo(() => [
    'London', 'Paris', 'New York', 'Tokyo', 'Berlin', 'Rome', 'Barcelona', 
    'Amsterdam', 'Madrid', 'Vienna', 'Prague', 'Dubai', 'Singapore', 
    'Sydney', 'Melbourne', 'Los Angeles', 'San Francisco', 'Chicago', 
    'Boston', 'Miami', 'Toronto', 'Vancouver', 'Montreal', 'Hong Kong',
    'Bangkok', 'Seoul', 'Taipei', 'Shanghai', 'Beijing', 'Mumbai', 'Delhi',
    'Cairo', 'Istanbul', 'Athens', 'Lisbon', 'Dublin', 'Edinburgh', 'Manchester',
    'Birmingham', 'Liverpool', 'Glasgow', 'Bristol', 'Leeds', 'Newcastle'
  ], [])

  // Check if a city name matches a major city
  const isMajorCity = useCallback((cityName: string): boolean => {
    const normalized = cityName.toLowerCase().trim()
    return MAJOR_CITIES.some(major => normalized.includes(major.toLowerCase()) || major.toLowerCase().includes(normalized))
  }, [MAJOR_CITIES])

  // Extract city name from location string (e.g., "London, UK" -> "London")
  const extractCityName = useCallback((locationString: string): { city: string; country: string | null } => {
    const parts = locationString.split(',').map(s => s.trim())
    const city = parts[0] || locationString
    const country = parts.length > 1 ? parts[parts.length - 1] : null
    return { city, country }
  }, [])

  // Save city and locations to Supabase
  const saveCityToSupabase = useCallback(async (
    cityName: string,
    country: string | null,
    lat: number,
    lng: number,
    locations: DiscoverLocation[]
  ) => {
    try {
      const isMajor = isMajorCity(cityName)
      
      // Only save major cities or cities with enough locations (even if not all have ratings yet)
      // Check for locations with ratings OR just count total locations for major cities
      const highRatedCount = locations.filter(loc => loc.rating && loc.rating >= 4.5 && loc.reviews && loc.reviews >= 100).length
      const hasEnoughLocations = locations.length >= 10 // Need at least 10 locations to save
      
      if (!isMajor && (highRatedCount < 10 || !hasEnoughLocations)) {
        console.log(`[API] Skipping save for "${cityName}" - not major city and doesn't meet criteria (highRated: ${highRatedCount}, total: ${locations.length})`)
        return // Skip saving if not major and doesn't have enough high-rated locations or total locations
      }
      
      if (locations.length === 0) {
        console.warn(`[API] Cannot save city "${cityName}" - no locations provided`)
        return
      }

      console.log(`[API] POST /api/cities - Saving city "${cityName}"${country ? `, ${country}` : ''} with ${locations.length} locations (isMajor: ${isMajor})`)
      
      // Log sample data to verify reviews are correct
      if (locations.length > 0) {
        const sample = locations[0]
        console.log(`[API] Sample location data: "${sample.name}" - rating: ${sample.rating}, reviews: ${sample.reviews}`)
      }
      
      const startTime = performance.now()
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName,
          country,
          lat,
          lng,
          locations: locations.map(loc => ({
            name: loc.name,
            category: loc.category,
            description: loc.description,
            rating: typeof loc.rating === 'number' && loc.rating > 0 ? loc.rating : (loc.rating ? parseFloat(String(loc.rating)) : undefined),
            reviews: typeof loc.reviews === 'number' && loc.reviews > 0 ? loc.reviews : (loc.reviews ? parseInt(String(loc.reviews), 10) : undefined),
            lat: loc.lat,
            lng: loc.lng,
            distance: loc.distance,
            image: loc.image,
            placeId: (loc as any).placeId || undefined, // Save placeId for future enrichment
          })),
          isMajor,
        }),
      })
      const duration = performance.now() - startTime

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        console.log(`[API] POST /api/cities - Success (${duration.toFixed(2)}ms) - Saved city "${cityName}" with ${data.locationCount || locations.length} locations`)
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[API] POST /api/cities - Failed (${response.status}) - ${errorText}`)
      }
    } catch (error) {
      console.error('Error saving city to Supabase:', error)
    }
  }, [isMajorCity])


  // Get user's current location whenever "Around me" is active
  useEffect(() => {
    if (activeFilter === 'current-location' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Fallback: keep the UI usable even if geolocation is blocked
          setLocationName('London, UK')
          setUserLocation(LONDON_CENTER)
          addBanner(
            'info',
            'Location access blocked — showing results with a London fallback. Enable location to use “Around me”.'
          )
        }
      )
    }
  }, [activeFilter, LONDON_CENTER])

  // Helper to set location, URL params, and defaults (2km, around me)
  const setLocationFromCoords = (
    coords: { lat: number; lng: number },
    address: string,
    radiusKm: number = 2,
    message?: string
  ) => {
    setLocationName(address)
    setUserLocation({ lat: coords.lat, lng: coords.lng })
    setActiveFilter('current-location')
    setSearchRadius(radiusKm)
    setCommittedSearchQuery('')
    setShowSuggestions(false)
    // Mark that user explicitly searched/entered a location (triggers API calls)
    setInitializedFromUrl(true)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('lat', coords.lat.toString())
      params.set('lng', coords.lng.toString())
      params.set('radius', radiusKm.toString())
      params.set('q', address)
      router.replace(`?${params.toString()}`, { scroll: false })
    }

    if (message) {
      addBanner('success', message)
    }
  }

  // Load city locations from Supabase when cityId is provided
  useEffect(() => {
    const cityId = searchParams.get('cityId')
    
    if (cityId) {
      const loadCityLocations = async () => {
        console.log(`[API] GET /api/cities?cityId=${cityId} - Loading city locations from Supabase`)
        setLoadingAroundMe(true)
        try {
          const res = await fetch(`/api/cities?cityId=${cityId}`)
          if (res.ok) {
            const data = await res.json()
            const locations = data.locations || []
            
            console.log(`[API] GET /api/cities?cityId=${cityId} - Response: ${locations.length} locations`, locations.length > 0 ? locations.slice(0, 2) : 'No locations')
            
            if (locations.length === 0) {
              console.warn(`[API] No locations found for cityId=${cityId}. Check if city has locations saved in Supabase.`)
            }
            
            // Convert to DiscoverLocation format
            const discoverLocations: DiscoverLocation[] = locations.map((loc: any, idx: number) => {
              // Ensure numeric conversion for rating and reviews
              const rating = typeof loc.rating === 'number' ? loc.rating : (typeof loc.rating === 'string' ? parseFloat(loc.rating) : undefined)
              const reviews = typeof loc.reviews === 'number' ? loc.reviews : (typeof loc.reviews === 'string' ? parseInt(loc.reviews, 10) : undefined)
              
              // Check if this looks like old default data (exactly 4.5 rating and 100 reviews)
              // Also check for 0 values which might be defaults
              // Treat these as missing data that needs enrichment
              const isLikelyOldData = (rating === 4.5 && reviews === 100) || 
                                     (rating === 0 && reviews === 0) ||
                                     (rating === 4.5 && reviews === 0) ||
                                     (rating === 0 && reviews === 100)
              
              console.log(`[API] Loading location "${loc.name}": rating=${rating}, reviews=${reviews} (raw: rating=${loc.rating}, reviews=${loc.reviews})${isLikelyOldData ? ' - DETECTED OLD DEFAULT DATA, WILL ENRICH' : ''}`)
              
              return {
                id: loc.id || String(idx + 1),
                name: loc.name,
                category: loc.category,
                description: loc.description || `Popular ${loc.category.toLowerCase()}`,
                // If it's old default data, treat as undefined so it gets enriched
                rating: isLikelyOldData ? undefined : (rating !== undefined && !isNaN(rating) && rating > 0 ? rating : undefined),
                reviews: isLikelyOldData ? undefined : (reviews !== undefined && !isNaN(reviews) && reviews > 0 ? reviews : undefined),
                distance: loc.distance || '0 km',
                lat: typeof loc.lat === 'number' ? loc.lat : (loc.lat ? parseFloat(String(loc.lat)) : undefined),
                lng: typeof loc.lng === 'number' ? loc.lng : (loc.lng ? parseFloat(String(loc.lng)) : undefined),
                placeId: loc.place_id || undefined, // Store place_id for enrichment
                needsEnrichment: isLikelyOldData || (!rating && !reviews) || (rating === 0 && reviews === 0), // Flag locations that need enrichment
              }
            })
            
            // NO AUTOMATIC ENRICHMENT - Data is already in database
            // Only enrich if user manually clicks "Load Details" button
            // This prevents unnecessary API calls when viewing cached city data
            console.log(`[API] Loaded ${discoverLocations.length} locations from Supabase - No automatic enrichment (data already in DB)`)
            
            setAroundMeLocations(discoverLocations)
            setResultsSource('cached')
            
            // Update coordinates map
            const coordsMap = new Map<string, { lat: number; lng: number }>()
            discoverLocations.forEach((loc) => {
              if (loc.lat && loc.lng) {
                coordsMap.set(loc.id, { lat: loc.lat, lng: loc.lng })
              }
            })
            if (coordsMap.size > 0) {
              setLocationCoords((prev) => {
                const next = new Map(prev)
                coordsMap.forEach((coords, id) => {
                  next.set(id, coords)
                })
                return next
              })
            }
            
            console.log(`[API] GET /api/cities?cityId=${cityId} - Success - Loaded ${discoverLocations.length} locations from Supabase`)
            
            // If no locations found, show a helpful message
            if (discoverLocations.length === 0) {
              console.warn(`[API] No locations found for cityId=${cityId}. This city may not have locations saved yet.`)
              addBanner('info', 'No locations found for this city. Try searching for locations in this city first to save them.')
            }
          } else {
            const errorText = await res.text().catch(() => 'Unknown error')
            console.error(`[API] GET /api/cities?cityId=${cityId} - Failed (${res.status}): ${errorText}`)
            addBanner('error', `Failed to load city locations: ${res.status === 404 ? 'City not found' : 'Server error'}`)
          }
        } catch (error) {
          console.error(`[API] GET /api/cities?cityId=${cityId} - Error:`, error)
        } finally {
          setLoadingAroundMe(false)
        }
      }
      
      void loadCityLocations()
    }
    // Only depend on searchParams to avoid unnecessary re-runs when userLocation or locationName change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Initialize from URL params if present
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')
    const q = searchParams.get('q')
    const cityId = searchParams.get('cityId')

    // If cityId is present, we've already loaded locations in the previous effect
    // Just set up the location display
    if (cityId && lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusNum = radius ? parseFloat(radius) : 10

      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setInitializedFromUrl(true)
        setLocationName(q || 'City')
        setSearchQuery(q || '')
        setUserLocation({ lat: latNum, lng: lngNum })
        setActiveFilter('current-location')
        setSearchRadius(!isNaN(radiusNum) && radiusNum > 0 ? radiusNum : 10)
        setCommittedSearchQuery('')
      }
      return
    }

    // Otherwise, handle regular location params
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusNum = radius ? parseFloat(radius) : 2

      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setInitializedFromUrl(true)
        // Treat q as the label for the center point, NOT as a filter query.
        // Otherwise we'd filter results down to just the typed city name.
        setLocationName(q || 'Custom location')
        setSearchQuery(q || '')
        setUserLocation({ lat: latNum, lng: lngNum })
        setActiveFilter('current-location')
        setSearchRadius(!isNaN(radiusNum) && radiusNum > 0 ? radiusNum : 2)
        setCommittedSearchQuery('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // On first page load, show hardcoded static locations (no API calls)
  // Only trigger "around me" if URL parameters are provided (user shared/bookmarked a location)
  // Otherwise, user must explicitly click "Around me" button to trigger API calls

  const enableAroundMe = () => {
    setActiveFilter('current-location')

    if (!navigator.geolocation) {
      addBanner('error', 'Your browser does not support geolocation.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        // Mark that user explicitly enabled "around me" (not initial load)
        setInitializedFromUrl(true)
        // Trigger search immediately when user clicks "Around me"
        setSearchRadius(5) // Default radius
        setLocationName('My Current Location')
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLocationName('London, UK')
        setUserLocation(LONDON_CENTER)
        setInitializedFromUrl(true) // Still mark as initialized so API calls happen
        addBanner('info', 'Location access blocked — showing results with a London fallback. Enable location to use "Around me".')
      }
    )
  }

  const handleSearchLocationByText = async () => {
    const value = searchQuery.trim()
    if (!value) {
      addBanner('info', 'Type a location name first.')
      return
    }

    setIsSearchingLocation(true)
    try {
      const result = await geocodeAddress(value)
      if (!result) {
        addBanner('error', `Could not find "${value}". Try a more specific name.`)
        return
      }

      setLocationFromCoords(
        { lat: result.lat, lng: result.lng },
        result.address,
        2,
        `Showing locations within 2km of ${result.address}.`
      )

      // After setting location, searchAroundMe will be triggered which will save the city if appropriate
      // This happens automatically via the useEffect that watches searchAroundMe
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // Compute distance in km between two coordinates (Haversine formula)
  const getDistanceKm = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number => {
    const R = 6371 // Earth's radius in km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const lat1 = (a.lat * Math.PI) / 180
    const lat2 = (b.lat * Math.PI) / 180

    const sinDLat = Math.sin(dLat / 2)
    const sinDLng = Math.sin(dLng / 2)

    const c =
      sinDLat * sinDLat +
      Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

    const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
    return R * d
  }

  const searchAroundMe = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      // Don't clear aroundMeLocations if we're viewing a city (cityId in URL)
      // This preserves city data when filters change
      const cityId = searchParams.get('cityId')
      const isViewingCity = !!cityId
      
      if (activeFilter !== 'current-location' || !userLocation) {
        // Only clear aroundMeLocations if NOT viewing a city
        // When viewing a city, preserve the city locations even if filter changes
        if (!isViewingCity) {
          setAroundMeLocations([])
        }
        return
      }

      setLoadingAroundMe(true)
      try {
        const roundedLat = Math.round(userLocation.lat * 100) / 100
        const roundedLng = Math.round(userLocation.lng * 100) / 100
        const roundedRadius = Math.round(searchRadius * 10) / 10

        // Try cached/database data first (unless bypassed)
        if (!options?.bypassCache) {
          try {
            const cacheUrl = `/api/top-locations?mode=around&lat=${roundedLat}&lng=${roundedLng}&radius=${roundedRadius}`
            console.log(`[API] GET ${cacheUrl} - Checking cache for locations`)
            const startTime = performance.now()
            const res = await fetch(cacheUrl)
            const duration = performance.now() - startTime
            
            if (res.ok) {
              const data = await res.json()
              if (Array.isArray(data.locations) && data.locations.length > 0) {
                console.log(`[API] GET ${cacheUrl} - Cache hit (${duration.toFixed(2)}ms) - Found ${data.locations.length} cached locations`)
                const cached = data.locations as DiscoverLocation[]
                setAroundMeLocations(cached)

                // Restore coordinates if present in cached rows
                const coordsMap = new Map<string, { lat: number; lng: number }>()
                cached.forEach((loc: any) => {
                  if (loc.lat && loc.lng) {
                    coordsMap.set(loc.id, { lat: loc.lat, lng: loc.lng })
                  }
                })
                if (coordsMap.size > 0) {
                  setLocationCoords((prev) => {
                    const next = new Map(prev)
                    coordsMap.forEach((coords, id) => {
                      next.set(id, coords)
                    })
                    return next
                  })
                }

                setResultsSource('cached')
                return
              } else {
                console.log(`[API] GET ${cacheUrl} - Cache miss (${duration.toFixed(2)}ms) - No cached locations found`)
              }
            } else {
              console.error(`[API] GET ${cacheUrl} - Failed (${res.status}) - ${res.statusText}`)
            }
          } catch (e) {
            console.warn('[API] Failed to load cached top locations:', e)
          }
        }

        setResultsSource('live')
        console.log(`[API] Searching for places around ${locationName || 'current location'} (lat: ${roundedLat}, lng: ${roundedLng}, radius: ${roundedRadius}km)`)

        // Reduced to 2 most important queries to minimize API calls
        // These broad queries return diverse results (attractions, restaurants, landmarks, etc.)
        const searchQueries = [
          'tourist attractions', // Covers attractions, landmarks, points of interest
          'restaurants', // Covers dining and food
        ]

        const foundPlaces: any[] = []
        const newCoords = new Map<string, { lat: number; lng: number }>()

        // Search with reduced queries to minimize API calls while still getting diverse results
        for (const query of searchQueries) {
          if (foundPlaces.length >= 20) break // Limit to 20 locations as default

          try {
            // Google Places API max radius is 50,000 meters (50 km)
            // For larger radii, we search with max radius and filter by actual distance
            const apiRadiusMeters = Math.min(searchRadius * 1000, 50000)

            const places = await searchPlaces(query, userLocation, apiRadiusMeters)

            // Log sample place data to verify API response
            if (places.length > 0) {
              console.log(`[API] Sample place from searchPlaces: "${places[0].name}" - rating: ${places[0].rating}, reviews: ${places[0].reviews}`)
            }

            places.forEach((place) => {
              if (foundPlaces.length >= 20) return // Limit to 20 locations as default

              // Check for duplicates by name
              const isDuplicate = foundPlaces.some(
                (loc) => loc.name.toLowerCase() === place.name.toLowerCase()
              )

              if (!isDuplicate) {
                // Calculate distance from user
                const distanceKm = getDistanceKm(userLocation, { lat: place.lat, lng: place.lng })

                // Filter by actual selected radius (works for all values including > 50km)
                if (distanceKm <= searchRadius) {
                  const locationId = String(foundPlaces.length + 1)

                  // Log if we're getting default values
                  if ((place.rating === undefined || place.rating === 0) && (place.reviews === undefined || place.reviews === 0)) {
                    console.warn(`[API] Place "${place.name}" has no rating/reviews data from Text Search API - will need Place Details`)
                  }

                  const loc: any = {
                    id: locationId,
                    name: place.name,
                    category: place.category || 'Attraction',
                    description: `Popular ${place.category || 'attraction'} near you`,
                    rating: place.rating !== undefined && place.rating !== null ? place.rating : undefined, // Only set if present
                    reviews: place.reviews !== undefined && place.reviews !== null ? place.reviews : undefined, // Only set if present
                    distance: `${distanceKm.toFixed(1)} km`,
                    lat: place.lat,
                    lng: place.lng,
                    placeId: place.placeId, // Store place_id for later enrichment
                  }
                  
                  // Log if we don't have rating/reviews
                  if (!loc.rating && !loc.reviews && loc.placeId) {
                    console.log(`[API] Location "${loc.name}" missing rating/reviews, will enrich with place_id: ${loc.placeId}`)
                  }

                  foundPlaces.push(loc)

                  // Store coordinates for map
                  newCoords.set(locationId, { lat: place.lat, lng: place.lng })
                }
              }
            })
          } catch (error) {
            console.error(`Error searching for ${query}:`, error)
          }
        }

        // Batch update coordinates
        setLocationCoords((prev) => {
          const next = new Map(prev)
          newCoords.forEach((coords, id) => {
            next.set(id, coords)
          })
          return next
        })

        // Enrich locations without rating/reviews using Place Details API
        // Only enrich top 10 locations to minimize API calls
        const locationsToEnrich = foundPlaces
          .filter(loc => (!loc.rating && !loc.reviews) && loc.placeId)
          .slice(0, 10)
        
        if (locationsToEnrich.length > 0) {
          console.log(`[API] Enriching ${locationsToEnrich.length} locations with Place Details API to get rating/reviews`)
          
          // Enrich locations in batches to avoid rate limiting
          const BATCH_SIZE = 3
          for (let i = 0; i < locationsToEnrich.length; i += BATCH_SIZE) {
            const batch = locationsToEnrich.slice(i, i + BATCH_SIZE)
            await Promise.all(
              batch.map(async (loc) => {
                if (!loc.placeId) return
                
                try {
                  const details = await getPlaceDetails(loc.placeId)
                  if (details) {
                    // Update the location with enriched data
                    const index = foundPlaces.findIndex(l => l.id === loc.id)
                    if (index !== -1) {
                      if (details.rating !== undefined && details.rating !== null) {
                        foundPlaces[index].rating = details.rating
                      }
                      if (details.reviews !== undefined && details.reviews !== null) {
                        foundPlaces[index].reviews = details.reviews
                      }
                      console.log(`[API] Enriched "${loc.name}": rating=${foundPlaces[index].rating}, reviews=${foundPlaces[index].reviews}`)
                    }
                  }
                } catch (error) {
                  console.error(`[API] Failed to enrich place "${loc.name}":`, error)
                }
              })
            )
            // Small delay between batches
            if (i + BATCH_SIZE < locationsToEnrich.length) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }

        setAroundMeLocations(foundPlaces)
        console.log(`[API] Found ${foundPlaces.length} locations around ${locationName || 'current location'}`)

        // Persist results to Supabase cache (best-effort)
        try {
          console.log(`[API] POST /api/top-locations - Saving ${foundPlaces.length} locations to cache`)
          const startTime = performance.now()
          const res = await fetch('/api/top-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'around',
              lat: roundedLat,
              lng: roundedLng,
              radius: roundedRadius,
              locations: foundPlaces,
            }),
          })
          const duration = performance.now() - startTime
          
          if (res.ok) {
            console.log(`[API] POST /api/top-locations - Success (${duration.toFixed(2)}ms) - Cached ${foundPlaces.length} locations`)
          } else {
            console.error(`[API] POST /api/top-locations - Failed (${res.status}) - ${res.statusText}`)
          }
        } catch (e) {
          console.warn('[API] POST /api/top-locations - Error saving cache:', e)
        }

        // Save city to Supabase if it's a major city or has enough high-rated locations (async, non-blocking)
        if (locationName && foundPlaces.length > 0) {
          const { city, country } = extractCityName(locationName)
          if (city && userLocation) {
            // Save city asynchronously without blocking the UI
            // Only save if it's a major city or has enough high-rated locations
            const highRatedCount = foundPlaces.filter(loc => loc.rating >= 4.5 && loc.reviews >= 100).length
            const isMajor = isMajorCity(city)
            
            if (isMajor || highRatedCount >= 10) {
              // Save with current data (enrichment can happen later if needed)
              void saveCityToSupabase(city, country, userLocation.lat, userLocation.lng, foundPlaces)
            }
          }
        }
      } catch (error) {
        console.error('Error searching around me:', error)
        addBanner('error', 'Failed to find places near you. Please try again.')
      } finally {
        setLoadingAroundMe(false)
      }
    },
    [activeFilter, userLocation, searchRadius, locationName, extractCityName, isMajorCity, saveCityToSupabase]
  )

  // Search for places around user's location when "Around me" is active
  // Only trigger API calls when user explicitly enables "around me" (initializedFromUrl = true)
  // On initial page load (initializedFromUrl = false), show static hardcoded locations instead
  useEffect(() => {
    // Don't search if viewing a city (cityId in URL) - preserve city data
    const cityId = searchParams.get('cityId')
    const isViewingCity = !!cityId
    
    // Only search if:
    // 1. "Around me" filter is active
    // 2. User location is set
    // 3. User explicitly enabled it (initializedFromUrl = true) OR URL params exist (shared/bookmarked)
    // 4. NOT viewing a city (to preserve city data)
    if (activeFilter === 'current-location' && userLocation && initializedFromUrl && !isViewingCity) {
      // Debounce to prevent rapid API calls when radius changes quickly
      const timeoutId = setTimeout(() => {
        void searchAroundMe()
      }, 500) // Wait 500ms after last change before searching

      return () => clearTimeout(timeoutId)
    }
  }, [activeFilter, userLocation, searchAroundMe, initializedFromUrl, searchParams])

  // Get all unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    const locationsToUse = activeFilter === 'current-location' && aroundMeLocations.length > 0
      ? aroundMeLocations
      : discoverLocations
    locationsToUse.forEach(loc => {
      if (loc.category) categories.add(loc.category)
    })
    return Array.from(categories).sort()
  }, [activeFilter, aroundMeLocations])

  // (removed debug-only logs and mobile detection)

  // Format reviews
  const formatReviews = (count: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(count)
  }

  // Parse distance string to number (km) from static seed data
  const parseDistance = (distanceStr: string): number => {
    const match = distanceStr.match(/(\d+\.?\d*)\s*(km|m)/i)
    if (!match) return 0
    const value = parseFloat(match[1])
    return match[2].toLowerCase() === 'km' ? value : value / 1000
  }

  // Fetch autocomplete suggestions from Google Places API (worldwide)
  useEffect(() => {
    const fetchAutocomplete = async () => {
      const query = searchQuery.trim()
      
      // Don't search if query is too short or empty
      if (!query || query.length < 2) {
        setAutocompleteSuggestions([])
        return
      }

      // Don't search if user just pressed Enter (committed search)
      if (committedSearchQuery && query === committedSearchQuery) {
        setAutocompleteSuggestions([])
        return
      }

      setLoadingAutocomplete(true)
      try {
        // Use user location for biasing if available, otherwise global search
        const location = activeFilter === 'current-location' && userLocation ? userLocation : undefined
        const suggestions = await getAutocompleteSuggestions(query, location)
        setAutocompleteSuggestions(suggestions)
      } catch (error) {
        console.error('Error fetching autocomplete:', error)
        setAutocompleteSuggestions([])
      } finally {
        setLoadingAutocomplete(false)
      }
    }

    // Debounce autocomplete requests
    const timeoutId = setTimeout(() => {
      void fetchAutocomplete()
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [searchQuery, userLocation, activeFilter, committedSearchQuery])

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    // Check if we're viewing a city from DiscoverCard (cityId in URL)
    const cityId = searchParams.get('cityId')
    const isViewingCity = !!cityId
    
    // Use "around me" locations when:
    // 1. The "current-location" filter is active, OR
    // 2. We're viewing a city from DiscoverCard (cityId in URL) - ALWAYS use city locations when cityId is present
    // When viewing a city, always use aroundMeLocations (even if empty) to prevent falling back to discoverLocations
    const locationsToFilter = (activeFilter === 'current-location' || isViewingCity)
      ? aroundMeLocations
      : discoverLocations

    // Ensure locationsToFilter is an array
    if (!locationsToFilter || !Array.isArray(locationsToFilter) || locationsToFilter.length === 0) {
      return []
    }

    let filtered = [...locationsToFilter]

    // Apply search filter (debounced while typing; immediate when Enter is pressed)
    if (effectiveSearchQuery) {
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
          loc.category.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
          loc.description.toLowerCase().includes(effectiveSearchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(loc => selectedCategories.includes(loc.category))
    }

    // Apply review count filter
    filtered = filtered.filter(
      (loc) => loc.reviews >= minReviews && loc.reviews <= maxReviews
    )

    // Apply distance filter (for "Around me")
    if (activeFilter === 'current-location' && searchRadius > 0 && userLocation) {
      filtered = filtered.filter((loc) => {
        // For "around me" locations, check actual distance from userLocation
        if (aroundMeLocations.length > 0) {
          const coords = locationCoords.get(loc.id)
          if (coords) {
            const distanceKm = getDistanceKm(userLocation, coords)
            return distanceKm <= searchRadius
          }
          // Fallback: parse distance string if coordinates not available
          const staticDistanceKm = parseDistance(loc.distance)
          return staticDistanceKm <= searchRadius
        }
        // For static locations, use distance string
        const staticDistanceKm = parseDistance(loc.distance)
        return staticDistanceKm <= searchRadius
      })
    }

    // Apply rating filters
    if (activeFilter === 'best') {
      filtered = filtered.filter((loc) => loc.rating >= 4.7)
    } else if (activeFilter === 'top-rated') {
      filtered = filtered.filter((loc) => loc.rating >= 4.6)
    } else if (activeFilter === 'hidden-gems') {
      filtered = filtered.filter((loc) => loc.reviews < 5000 && loc.rating >= 4.5)
    }

    // Sort locations - always prioritize by most reviewed first, then apply user's selected sort
    let sorted = [...filtered]
    
    // Primary sort: Always by reviews (most reviewed first)
    sorted = sorted.sort((a, b) => {
      const reviewsA = a.reviews || 0
      const reviewsB = b.reviews || 0
      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA // Most reviewed first
      }
      // If reviews are equal, use rating as secondary sort
      const ratingA = a.rating || 0
      const ratingB = b.rating || 0
      return ratingB - ratingA
    })
    
    // Then apply user's selected sort as a secondary sort (if different from most-reviewed)
    if (sortBy !== 'most-reviewed') {
      switch (sortBy) {
        case 'best':
          // Combined score: rating * 0.6 + (normalized reviews) * 0.4
          sorted = sorted.sort((a, b) => {
            const scoreA = (a.rating || 0) * 0.6 + Math.min((a.reviews || 0) / 10000, 1) * 0.4
            const scoreB = (b.rating || 0) * 0.6 + Math.min((b.reviews || 0) / 10000, 1) * 0.4
            if (Math.abs(scoreB - scoreA) > 0.01) {
              return scoreB - scoreA
            }
            // If scores are very close, maintain reviews order
            return (b.reviews || 0) - (a.reviews || 0)
          })
          break
        case 'top-rated':
          sorted = sorted.sort((a, b) => {
            const ratingA = a.rating || 0
            const ratingB = b.rating || 0
            if (ratingB !== ratingA) {
              return ratingB - ratingA
            }
            // If ratings are equal, maintain reviews order
            return (b.reviews || 0) - (a.reviews || 0)
          })
          break
        case 'hidden-gems':
          sorted = sorted.filter(loc => (loc.reviews || 0) < 5000 && (loc.rating || 0) >= 4.5)
            .sort((a, b) => {
              const ratingA = a.rating || 0
              const ratingB = b.rating || 0
              if (ratingB !== ratingA) {
                return ratingB - ratingA
              }
              // If ratings are equal, maintain reviews order
              return (b.reviews || 0) - (a.reviews || 0)
            })
          break
        case 'worst-rated':
          sorted = sorted.sort((a, b) => {
            const ratingA = a.rating || 0
            const ratingB = b.rating || 0
            if (ratingA !== ratingB) {
              return ratingA - ratingB
            }
            // If ratings are equal, maintain reviews order
            return (b.reviews || 0) - (a.reviews || 0)
          })
          break
        case 'recently-discovered':
          // Sort by ID (newer IDs = more recent), but maintain reviews order for same IDs
          sorted = sorted.sort((a, b) => {
            const idA = parseInt(a.id) || 0
            const idB = parseInt(b.id) || 0
            if (idB !== idA) {
              return idB - idA
            }
            // If IDs are equal, maintain reviews order
            return (b.reviews || 0) - (a.reviews || 0)
          })
          break
      }
    }

    return sorted
  }, [effectiveSearchQuery, activeFilter, sortBy, searchRadius, minReviews, maxReviews, selectedCategories, userLocation, aroundMeLocations, locationCoords, searchParams, discoverLocations])

  // Toggle location save/bookmark
  const toggleLocationSave = useCallback((locationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setSavedLocationIds((prev) => {
      const next = new Set(prev)
      if (next.has(locationId)) {
        next.delete(locationId)
        addBanner('info', 'Location removed from saved')
      } else {
        next.add(locationId)
        addBanner('success', 'Location saved!')
      }
      return next
    })
  }, [])

  // Open location in Google Maps
  const handleOpenInGoogleMaps = useCallback((location: DiscoverLocation, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    const coords = locationCoords.get(location.id)
    openInGoogleMaps({
      name: location.name,
      lat: location.lat || coords?.lat,
      lng: location.lng || coords?.lng,
    })
  }, [locationCoords])

  // Toggle location selection
  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(locationId)) {
        newSet.delete(locationId)
      } else {
        newSet.add(locationId)
      }
      return newSet
    })
  }

  // Select/deselect all filtered locations
  const toggleSelectAll = () => {
    const allFilteredIds = new Set(filteredLocations.map(loc => loc.id))
    const allSelected = filteredLocations.length > 0 && 
                       filteredLocations.every(loc => selectedLocationIds.has(loc.id))
    
    if (allSelected) {
      // Deselect all filtered locations
      setSelectedLocationIds(prev => {
        const newSet = new Set(prev)
        filteredLocations.forEach(loc => newSet.delete(loc.id))
        return newSet
      })
    } else {
      // Select all filtered locations
      setSelectedLocationIds(prev => {
        const newSet = new Set(prev)
        filteredLocations.forEach(loc => newSet.add(loc.id))
        return newSet
      })
    }
  }

  // Check if all filtered locations are selected
  const allFilteredSelected = useMemo(() => {
    return filteredLocations.length > 0 && 
           filteredLocations.every(loc => selectedLocationIds.has(loc.id))
  }, [filteredLocations, selectedLocationIds])

  // Get selected locations with coordinates
  const selectedLocations = useMemo(() => {
    return filteredLocations
      .filter(loc => selectedLocationIds.has(loc.id))
      .map(loc => {
        const coords = locationCoords.get(loc.id)
        return {
          name: loc.name,
          lat: coords?.lat,
          lng: coords?.lng,
          address: `${loc.name}, London, UK`,
        }
      })
  }, [filteredLocations, selectedLocationIds, locationCoords])

  // All visible locations (filtered) as lightweight location objects for routes/share
  const allVisibleLocations = useMemo(() => {
    return filteredLocations.map((loc) => ({
      name: loc.name,
      address: `${loc.name}, London, UK`,
    }))
  }, [filteredLocations])

  // Initialize coordinates from static location data (no API calls needed!)
  // Only geocode dynamic "around me" locations that don't have coordinates
  useEffect(() => {
    // For static locations from discoverLocations, use their pre-populated coordinates
    filteredLocations.forEach((loc) => {
      // Only set if not already set and location has lat/lng in data
      if (!locationCoords.has(loc.id) && loc.lat !== undefined && loc.lng !== undefined) {
        setLocationCoords((prev) => {
          const next = new Map(prev)
          if (!next.has(loc.id)) {
            next.set(loc.id, { lat: loc.lat!, lng: loc.lng! })
          }
          return next
        })
      }
    })
    // Only run when filteredLocations changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations.length, filteredLocations.map(l => l.id).join(',')])

  // Create circular Google Maps route
  const handleCreateCircularRoute = () => {
    if (selectedLocations.length === 0) {
      addBanner('error', 'Please select at least one location')
      return
    }

    const routeUrl = createCircularGoogleMapsRoute(selectedLocations)
    window.open(routeUrl, '_blank')
  }

  // Create circular route for all currently visible locations
  const handleCreateRouteForAll = () => {
    if (allVisibleLocations.length === 0) {
      addBanner('error', 'No locations to create a route from the current filters.')
      return
    }

    const routeUrl = createCircularGoogleMapsRoute(allVisibleLocations)
    window.open(routeUrl, '_blank')
    addBanner(
      'success',
      `Opening a Google Maps route for ${allVisibleLocations.length} location${
        allVisibleLocations.length !== 1 ? 's' : ''
      }...`
    )
  }

  // Share a Google Maps link for all currently visible locations (copy to clipboard)
  const handleShareAll = async () => {
    if (allVisibleLocations.length === 0) {
      addBanner('error', 'No locations to share from the current filters.')
      return
    }

    try {
      const routeUrl = createCircularGoogleMapsRoute(allVisibleLocations)
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(routeUrl)
        addBanner(
          'success',
          `Shareable Google Maps link copied for ${allVisibleLocations.length} location${
            allVisibleLocations.length !== 1 ? 's' : ''
          }.`
        )
      } else {
        // Fallback: open in new tab and show info banner
        window.open(routeUrl, '_blank')
        addBanner(
          'info',
          'Opened Google Maps route in a new tab. Copy the URL from your browser to share.'
        )
      }
    } catch (error) {
      console.error('Error sharing all locations route:', error)
      addBanner('error', 'Failed to create a shareable Google Maps link. Please try again.')
    }
  }

  const loadGoogleEnrichment = async (location: DiscoverLocation, forceRefresh = false) => {
    // Prevent duplicate requests unless forcing refresh
    if (!forceRefresh && googleEnrichmentLoading.has(location.id)) {
      console.log(`[Enrichment] Already loading details for "${location.name}"`)
      return
    }
    
    // If enrichment already exists and not forcing refresh, skip
    if (!forceRefresh && Object.prototype.hasOwnProperty.call(googleEnrichmentByLocationId, location.id)) {
      console.log(`[Enrichment] Details already loaded for "${location.name}"`)
      return
    }

    setGoogleEnrichmentLoading((prev) => new Set(prev).add(location.id))
    try {
      // First check if location already has a placeId stored
      let placeId = (location as any).placeId
      
      // If no placeId, try to find it
      if (!placeId) {
        // Use coordinates if available, otherwise use user location or London center
        const searchLocation = (location.lat && location.lng) 
          ? { lat: location.lat, lng: location.lng }
          : (activeFilter === 'current-location' && userLocation 
            ? userLocation 
            : LONDON_CENTER)
        
        // Build query - try multiple formats for better matching
        const cityName = locationName || searchParams.get('q') || 'London, UK'
        // Try just the location name first (more likely to match)
        let query = location.name
        let placeIdResult = await findPlaceIdByText(query, searchLocation, 50000) // Increase radius for better results
        
        // If that fails, try with city name
        if (!placeIdResult) {
          query = `${location.name}, ${cityName}`
          placeIdResult = await findPlaceIdByText(query, searchLocation, 50000)
        }
        
        // If still fails, try with "London, UK" explicitly
        if (!placeIdResult && !cityName.includes('London')) {
          query = `${location.name}, London, UK`
          placeIdResult = await findPlaceIdByText(query, searchLocation, 50000)
        }
        
        placeId = placeIdResult
        
        if (!placeId) {
          console.warn(`[Enrichment] ❌ Could not find place_id for "${location.name}" after trying multiple query formats`)
          // Don't show error banner - just log it, user can try manually
          setGoogleEnrichmentByLocationId((prev) => ({ ...prev, [location.id]: null }))
          return
        }
        console.log(`[Enrichment] ✅ Found place_id for "${location.name}": ${placeId}`)
      } else {
        console.log(`[Enrichment] Using stored place_id for "${location.name}": ${placeId}`)
      }

      console.log(`[Enrichment] Loading place details for "${location.name}" with place_id: ${placeId}`)
      const details = await getPlaceDetails(placeId)
      
      if (details) {
        console.log(`[Enrichment] ✅ Loaded details for "${location.name}":`, {
          address: details.address,
          rating: details.rating,
          reviews: details.reviews,
          phone: details.phone ? 'Yes' : 'No',
          website: details.website ? 'Yes' : 'No',
        })
        setGoogleEnrichmentByLocationId((prev) => ({ ...prev, [location.id]: details }))
        addBanner('success', `Loaded details for "${location.name}"`)
      } else {
        console.warn(`[Enrichment] ❌ No details returned for "${location.name}"`)
        // Don't show error banner - just log it silently
        // The location might still have basic info from Supabase
        setGoogleEnrichmentByLocationId((prev) => ({ ...prev, [location.id]: null }))
      }
    } catch (error) {
      console.error(`[Enrichment] ❌ Failed to load Google place enrichment for "${location.name}":`, error)
      // Don't show error banner - just log it silently
      // The location might still have basic info from Supabase
      setGoogleEnrichmentByLocationId((prev) => ({ ...prev, [location.id]: null }))
    } finally {
      setGoogleEnrichmentLoading((prev) => {
        const next = new Set(prev)
        next.delete(location.id)
        return next
      })
    }
  }

  // Convert to itinerary
  const handleConvertToItinerary = () => {
    if (selectedLocations.length === 0) {
      addBanner('error', 'Please select at least one location')
      return
    }

    // Create trip data
    const tripData = {
      destination: 'London, UK',
      days: String(Math.ceil(selectedLocations.length / 3)),
      dates: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + Math.ceil(selectedLocations.length / 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      interests: [],
      travelMode: 'walking' as const,
      pace: 'balanced' as const,
      accessibility: false,
    }

    // Convert to Location format
    const locations: Location[] = filteredLocations
      .filter(loc => selectedLocationIds.has(loc.id))
      .map(loc => {
        const coords = locationCoords.get(loc.id)
        return {
          id: loc.id,
          name: loc.name,
          lat: coords?.lat,
          lng: coords?.lng,
          category: loc.category,
          tags: [loc.category.toLowerCase()],
        }
      })

    // Create itinerary days, considering travel mode
    const travelMode = tripData.travelMode
    
    // Adjust locations per day based on travel mode
    const locationsPerDayByMode = {
      walking: 3,
      driving: 6,
      mixed: 4,
    }
    
    const baseLocationsPerDay = locationsPerDayByMode[travelMode]
    const daysCount = Math.ceil(locations.length / baseLocationsPerDay)
    const locationsPerDay = Math.ceil(locations.length / daysCount)
    const itineraryDays = []

    // Time estimates based on travel mode (in hours per location)
    const timePerLocation = {
      walking: { min: 1.5, max: 2.5 },
      driving: { min: 0.5, max: 1 },
      mixed: { min: 1, max: 1.5 },
    }
    
    // Distance estimates based on travel mode (in km per location)
    const distancePerLocation = {
      walking: 1.2,
      driving: 3.5,
      mixed: 2.0,
    }
    
    const timeEstimate = timePerLocation[travelMode]
    const distanceEstimate = distancePerLocation[travelMode]

    for (let i = 0; i < daysCount; i++) {
      const dayLocations = locations.slice(i * locationsPerDay, (i + 1) * locationsPerDay)
      const totalTime = dayLocations.length * timeEstimate.min
      const totalTimeMax = dayLocations.length * timeEstimate.max
      const totalDistance = (dayLocations.length * distanceEstimate).toFixed(1)
      
      const baseDay = {
        id: String(i + 1),
        day: i + 1,
        locations: dayLocations.map(loc => loc.name),
        estimatedTime: `${totalTime.toFixed(1)}-${totalTimeMax.toFixed(1)} hours`,
        distance: `${totalDistance} km`,
        pace: 'balanced' as const,
        notes: '',
        budget: `$${dayLocations.length * 20}-${dayLocations.length * 40}`,
      }
      
      // Enrich day with additional information
      const enrichedDay = enrichDayData(baseDay, i + 1, travelMode)
      itineraryDays.push(enrichedDay)
    }

    // Save to store
    setCurrentTrip(tripData)
    setSelectedLocations(locations)
    setItinerary(itineraryDays)

    // Navigate to itinerary page
    router.push('/app/itinerary')
  }

  // Convert locations to map format
  const mapLocations = useMemo(() => {
    const LONDON_CENTER_LAT = 51.5074
    const LONDON_CENTER_LNG = -0.1278

    // If user has selected locations, show only those on the map.
    // Otherwise, show all filtered locations.
    const source =
      selectedLocationIds.size > 0
        ? filteredLocations.filter((loc) => selectedLocationIds.has(loc.id))
        : filteredLocations

    const mapped = source.map((loc) => {
      // First check if location has coordinates in its data (static locations - no API call needed!)
      if (loc.lat !== undefined && loc.lng !== undefined &&
          typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
          !isNaN(loc.lat) && !isNaN(loc.lng) &&
          loc.lat >= -90 && loc.lat <= 90 &&
          loc.lng >= -180 && loc.lng <= 180) {
        return {
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          category: loc.category.toLowerCase().replace(/\s+/g, '-'),
        }
      }

      // Then check locationCoords map (for dynamic "around me" locations)
      const coords = locationCoords.get(loc.id)
      if (coords?.lat && coords?.lng && 
          typeof coords.lat === 'number' && typeof coords.lng === 'number' &&
          !isNaN(coords.lat) && !isNaN(coords.lng) &&
          coords.lat >= -90 && coords.lat <= 90 &&
          coords.lng >= -180 && coords.lng <= 180) {
        return {
          name: loc.name,
          lat: coords.lat,
          lng: coords.lng,
          category: loc.category.toLowerCase().replace(/\s+/g, '-'),
        }
      }

      // Fallback: approximate position from distance string (should rarely happen now)
      const distanceKm = parseDistance(loc.distance)
      
      // Use location name hash to create consistent but varied angles
      let hash = 0
      for (let i = 0; i < loc.name.length; i++) {
        hash = ((hash << 5) - hash) + loc.name.charCodeAt(i)
        hash = hash & hash // Convert to 32-bit integer
      }
      const angle = (Math.abs(hash) % 360) * (Math.PI / 180) // Convert to radians
      
      // Convert distance and angle to lat/lng offset
      // 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
      const latOffset = (distanceKm / 111) * Math.cos(angle)
      const lngOffset = (distanceKm / (111 * Math.cos(LONDON_CENTER_LAT * Math.PI / 180))) * Math.sin(angle)

      return {
        name: loc.name,
        lat: LONDON_CENTER_LAT + latOffset,
        lng: LONDON_CENTER_LNG + lngOffset,
        category: loc.category.toLowerCase().replace(/\s+/g, '-'),
      }
    })

    // Show a "You" marker when using around-me mode
    if (activeFilter === 'current-location' && userLocation) {
      return [
        { name: 'You', lat: userLocation.lat, lng: userLocation.lng, category: 'you' },
        ...mapped,
      ]
    }

    return mapped
  }, [filteredLocations, selectedLocationIds, locationCoords, activeFilter, userLocation])

  const LocationCard = ({ location, index, viewMode }: { location: DiscoverLocation; index: number; viewMode: ViewMode }) => {
    const isHighRated = location.rating > 4.7
    const isSelected = selectedLocationIds.has(location.id)
    const isSaved = savedLocationIds.has(location.id)
    const enrichment = googleEnrichmentByLocationId[location.id]
    const isLoading = googleEnrichmentLoading.has(location.id)

    // Only auto-enrich if NOT viewing cached city data (resultsSource !== 'cached')
    // When viewing cached data from Supabase, all info should already be in database - no API calls needed
    useEffect(() => {
      // Skip auto-enrichment when viewing cached city data to minimize API calls
      if (resultsSource === 'cached') {
        return
      }
      
      // Only auto-enrich top locations for live searches
      if (index < AUTO_ENRICH_COUNT) {
        void loadGoogleEnrichment(location)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, location.id, resultsSource])

    const isListView = viewMode === 'list'

    return (
      <div
        className={`bg-white rounded-2xl border ${
          isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-gray-200 shadow'
        } p-4 md:p-5 ${
          isListView ? 'flex flex-row gap-4' : 'flex flex-col gap-4 h-full'
        } cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => toggleLocationSelection(location.id)}
      >
        <div className={`flex items-center gap-3 ${isListView ? 'flex-shrink-0' : ''}`}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0">
            #{index + 1}
          </div>
          {!isListView && (
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900 text-base md:text-lg">{location.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs bg-secondary/50 border-primary/20 text-primary">
                  {location.category}
                </Badge>
                {(enrichment?.rating ?? location.rating) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {(enrichment?.rating ?? location.rating).toFixed(1)}
                    </span>
                    {(enrichment?.reviews ?? location.reviews) > 0 && (
                      <span className="text-[11px] text-gray-500">
                        ({formatReviews(enrichment?.reviews ?? location.reviews)})
                      </span>
                    )}
                  </div>
                )}
                {isHighRated && (
                  <span className="text-[11px] text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                    ⭐ Top Rated
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isListView && (
            <div className="mb-2">
              <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">{location.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs bg-secondary/50 border-primary/20 text-primary">
                  {location.category}
                </Badge>
                {(enrichment?.rating ?? location.rating) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {(enrichment?.rating ?? location.rating).toFixed(1)}
                    </span>
                    {(enrichment?.reviews ?? location.reviews) > 0 && (
                      <span className="text-[11px] text-gray-500">
                        ({formatReviews(enrichment?.reviews ?? location.reviews)})
                      </span>
                    )}
                  </div>
                )}
                {isHighRated && (
                  <span className="text-[11px] text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                    ⭐ Top Rated
                  </span>
                )}
              </div>
            </div>
          )}
          <p className={`text-sm text-gray-700 leading-relaxed ${isListView ? '' : 'mt-1 md:mt-0'}`}>
            {enrichment?.description?.trim() || location.description}
          </p>
          
          {/* Address */}
          {enrichment?.address && (
            <div className="flex items-start gap-2 mt-2">
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">{enrichment.address}</p>
            </div>
          )}

          {/* Phone */}
          {enrichment?.phone && (
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <a
                href={`tel:${enrichment.phone}`}
                className="text-xs text-gray-600 hover:text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {enrichment.phone}
              </a>
            </div>
          )}

          {/* Opening Hours */}
          {enrichment?.openingHours && enrichment.openingHours.length > 0 && (
            <div className="mt-2">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  {enrichment.openingHours.slice(0, 3).map((hours, idx) => (
                    <div key={idx}>{hours}</div>
                  ))}
                  {enrichment.openingHours.length > 3 && (
                    <div className="text-gray-400 italic">+{enrichment.openingHours.length - 3} more days</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price Level */}
          {enrichment?.priceLevel !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-gray-600">
                {enrichment.priceLevel === 0 && 'Free'}
                {enrichment.priceLevel === 1 && 'Inexpensive ($)'}
                {enrichment.priceLevel === 2 && 'Moderate ($$)'}
                {enrichment.priceLevel === 3 && 'Expensive ($$$)'}
                {enrichment.priceLevel === 4 && 'Very Expensive ($$$$)'}
              </span>
            </div>
          )}

          {/* Photos */}
          {enrichment?.photos && enrichment.photos.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {enrichment.photos.slice(0, 3).map((photo, idx) => (
                <a
                  key={idx}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  <img
                    src={photo}
                    alt={`${location.name} photo ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-primary transition-colors"
                  />
                </a>
              ))}
              {enrichment.photos.length > 3 && (
                <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{enrichment.photos.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => toggleLocationSave(location.id, e)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSaved
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save location'}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
            <button
              onClick={(e) => handleOpenInGoogleMaps(location, e)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Maps</span>
            </button>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{location.distance} away</span>
            </div>
            
            {enrichment?.website && (
              <a
                href={enrichment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Website
              </a>
            )}

            {enrichment?.googleMapsUrl && (
              <a
                href={enrichment.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Google Maps
              </a>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation()
                void loadGoogleEnrichment(location, !!enrichment) // Force refresh if enrichment exists
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading…
                </>
              ) : enrichment ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Details
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5" />
                  Load Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="min-h-screen bg-background">
        {/* Page Header */}
        <header className="sticky top-20 z-20 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-5">
          <div className="container mx-auto">
            <div className="flex items-start gap-4">
              <Link
                href="/discover"
                className="p-2 hover:bg-secondary rounded-xl transition-colors mt-1"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {activeFilter === 'current-location' ? `Best places in ${locationName}` : 'Top Rated Locations'}
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {activeFilter === 'current-location'
                    ? 'Discover the best rated places around you, blending top ratings with real visitor volume.'
                    : 'Discover the best places to visit, curated by rating, reviews, and hidden gems.'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6 bg-background">
          {/* Discover Card Section */}
          <div className="mb-6">
            <DiscoverCard />
          </div>

          {/* Banners (no animation to avoid opacity/transform issues) */}
          {banners.length > 0 && (
            <div className="mb-4 space-y-2">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`rounded-lg p-4 flex items-start justify-between gap-4 shadow-sm ${
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

          {/* Search and Around Me Bar - spans across both columns */}
          <div className="mb-6 bg-white rounded-2xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Search Input */}
        <div className="flex-1 w-full lg:max-w-md relative">
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                void handleSearchLocationByText()
                    }
                  }}
                  icon={<Search className="w-4 h-4 text-primary" />}
                  className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
                />

                {/* Autocomplete dropdown (Google Places API - worldwide) */}
                {showSuggestions && (autocompleteSuggestions.length > 0 || loadingAutocomplete) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-30">
                    {loadingAutocomplete ? (
                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Searching...
                      </div>
                    ) : (
                      autocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.placeId}-${index}`}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/40 flex items-center gap-2"
                          onClick={async () => {
                            // When user selects a suggestion, geocode it and set as location
                            setSearchQuery(suggestion.description)
                            setShowSuggestions(false)
                            
                          // Geocode the selected location
                          const coords = await geocodeAddress(suggestion.description)
                          if (coords) {
                            setLocationFromCoords(
                              { lat: coords.lat, lng: coords.lng },
                              suggestion.description,
                              2,
                              `Showing locations within 2km of ${suggestion.description}.`
                            )
                          } else {
                            // Fallback: just commit the search query
                            setCommittedSearchQuery(suggestion.description)
                          }
                          }}
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium text-gray-900 truncate">{suggestion.description}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Around me + radius */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full"
                  onClick={handleSearchLocationByText}
                  disabled={isSearchingLocation}
                >
                  {isSearchingLocation ? 'Searching…' : 'Search this location'}
                </Button>

                <Button
                  type="button"
                  variant={activeFilter === 'current-location' ? 'primary' : 'outline'}
                  className="rounded-full"
                  onClick={() => enableAroundMe()}
                >
                  📍 Around me
                </Button>

                {activeFilter === 'current-location' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Radius
                    </span>
                    {RADIUS_OPTIONS_KM.map((radius) => (
                      <Badge
                        key={radius}
                        variant={searchRadius === radius ? 'default' : 'outline'}
                        className={`cursor-pointer rounded-full transition-all ${
                          searchRadius === radius
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary/50'
                        }`}
                        onClick={() => setSearchRadius(radius)}
                      >
                        {radius} km
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two-column layout: filters left, map + list right */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr)] gap-6">
            {/* Filters Sidebar */}
            <aside className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 h-fit sticky top-28">

              {/* Filter Bar */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Quick filters
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'current-location', 'best', 'top-rated', 'hidden-gems'] as FilterType[]).map(
                    (filter) => (
                      <Badge
                        key={filter}
                        variant={activeFilter === filter ? 'default' : 'outline'}
                        className={`cursor-pointer capitalize rounded-full transition-all ${
                          activeFilter === filter
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary/50 hover:text-primary'
                        }`}
                        onClick={() => setActiveFilter(filter)}
                      >
                        {filter === 'all'
                          ? 'All'
                          : filter === 'current-location'
                          ? '📍 Near me'
                          : filter === 'best'
                          ? '🔥 Best'
                          : filter === 'top-rated'
                          ? '🏆 Top rated'
                          : '💎 Hidden gems'}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Sort results
                </p>
                <ToggleGroup
                  type="single"
                  value={sortBy}
                  onValueChange={(v) => v && setSortBy(v as SortType)}
                  className="flex-wrap gap-2"
                >
                  <ToggleGroupItem value="best" aria-label="Best" className="rounded-full">
                    🔥 Best
                  </ToggleGroupItem>
                  <ToggleGroupItem value="top-rated" aria-label="Top rated" className="rounded-full">
                    🏆 Top rated
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="most-reviewed"
                    aria-label="Most reviewed"
                    className="rounded-full"
                  >
                    🤩 Most reviewed
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="hidden-gems"
                    aria-label="Hidden gems"
                    className="rounded-full"
                  >
                    💎 Hidden gems
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="worst-rated"
                    aria-label="Worst rated"
                    className="rounded-full"
                  >
                    🤬 Worst rated
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="recently-discovered"
                    aria-label="Recently discovered"
                    className="rounded-full"
                  >
                    🆕 Recently discovered
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Search Radius (for current location) */}
              {activeFilter === 'current-location' && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Search radius
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 50, 100].map((radius) => (
                      <Badge
                        key={radius}
                        variant={searchRadius === radius ? 'default' : 'outline'}
                        className={`cursor-pointer rounded-full transition-all ${
                          searchRadius === radius
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary/50'
                        }`}
                        onClick={() => setSearchRadius(radius)}
                      >
                        {radius} km
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Number of Reviews Filter */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Review count
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '1 to 30 reviews', min: 1, max: 30 },
                    { label: '30 to 200 reviews', min: 30, max: 200 },
                    { label: '200 to 500 reviews', min: 200, max: 500 },
                    { label: '30+ reviews', min: 30, max: 100000 },
                    { label: '100+ reviews', min: 100, max: 100000 },
                    { label: '500+ reviews', min: 500, max: 100000 },
                    { label: '1000+ reviews', min: 1000, max: 100000 },
                  ].map((range) => (
                    <Badge
                      key={range.label}
                      variant={minReviews === range.min && maxReviews === range.max ? 'default' : 'outline'}
                      className={`cursor-pointer rounded-full transition-all ${
                        minReviews === range.min && maxReviews === range.max
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setMinReviews(range.min)
                        setMaxReviews(range.max)
                      }}
                    >
                      {range.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                      className={`cursor-pointer rounded-full transition-all ${
                        selectedCategories.includes(category)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(category)
                            ? prev.filter((c) => c !== category)
                            : [...prev, category]
                        )
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                  {selectedCategories.length > 0 && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-red-600 border-red-600 rounded-full hover:bg-red-50"
                      onClick={() => setSelectedCategories([])}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Badge>
                  )}
                </div>
              </div>
            </aside>

            {/* Map + Results */}
            <section className="space-y-5">
              {/* Map View (always visible) */}
              <Card className="h-80 md:h-96 overflow-hidden border-2 border-gray-200 shadow-lg relative" padding="none">
                {mapLocations.length > 0 ? (
                  <SimpleMap
                    locations={mapLocations}
                    selectedDay={1}
                    showRoute={false}
                    travelMode="walking"
                    onLocationClick={(loc) => {
                      if (loc.name === 'You') return
                      const location = filteredLocations.find((l) => l.name === loc.name)
                      if (location) {
                        openInGoogleMaps({ name: location.name })
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                      <p className="text-gray-600">No locations to display on map</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Results Header */}
              <div className="mb-4">
                <div className="flex flex-col gap-4 mb-4">
                  {/* Title and selection info */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {filteredLocations.length}{' '}
                        {activeFilter === 'all'
                          ? 'locations'
                          : activeFilter === 'best'
                          ? 'best locations'
                          : activeFilter === 'top-rated'
                          ? 'top-rated locations'
                          : activeFilter === 'current-location'
                          ? 'locations near you'
                          : 'hidden gems'}
                      </h2>
                      {selectedLocationIds.size > 0 && (
                        <p className="text-sm text-primary font-semibold mt-1 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          {selectedLocationIds.size} location
                          {selectedLocationIds.size !== 1 ? 's' : ''} selected
                        </p>
                      )}
                      {activeFilter === 'current-location' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Certain place categories are intentionally excluded to keep results high quality.
                        </p>
                      )}
                    </div>

                    {/* Select All and View Toggle buttons */}
                    {filteredLocations.length > 0 && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewMode('grid')
                            }}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'grid'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Grid view"
                            aria-label="Grid view"
                          >
                            <Grid3x3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewMode('two-column')
                            }}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'two-column'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="2 Column view"
                            aria-label="2 Column view"
                          >
                            <Columns className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewMode('list')
                            }}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'list'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="List view"
                            aria-label="List view"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Select All button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectAll()
                          }}
                          variant={allFilteredSelected ? 'primary' : 'outline'}
                          size="small"
                          className="flex items-center gap-2"
                        >
                          {allFilteredSelected ? (
                            <>
                              <CheckSquare className="w-4 h-4" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4" />
                              Select All
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action buttons row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Global actions for all visible results */}
                    {allVisibleLocations.length > 0 && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCreateRouteForAll()
                          }}
                          variant="outline"
                          size="small"
                          className="flex items-center gap-2"
                        >
                          <Navigation className="w-4 h-4" />
                          Open All in Google Maps
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShareAll()
                          }}
                          variant="secondary"
                          size="small"
                          className="flex items-center gap-2"
                        >
                          <MapIcon className="w-4 h-4" />
                          Share All as Link
                        </Button>

                        {/* When showing cached DB results, allow the user to refresh to live data */}
                        {activeFilter === 'current-location' && (resultsSource === 'cached' || searchParams.get('cityId')) && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              // If cityId is present, remove it and refresh with live data
                              if (searchParams.get('cityId')) {
                                const params = new URLSearchParams(window.location.search)
                                params.delete('cityId')
                                router.replace(`?${params.toString()}`, { scroll: false })
                                // Trigger a new search
                                setTimeout(() => {
                                  void searchAroundMe({ bypassCache: true })
                                }, 100)
                              } else {
                                void searchAroundMe({ bypassCache: true })
                              }
                            }}
                            variant="ghost"
                            size="small"
                            className="flex items-center gap-1 text-xs text-gray-700 hover:text-primary"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh with live data
                          </Button>
                        )}
                      </>
                    )}

                    {/* Action Buttons for selected locations */}
                    {selectedLocationIds.size > 0 && (
                      <>
                        <div className="h-4 w-px bg-gray-300 mx-1" />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCreateCircularRoute()
                          }}
                          variant="outline"
                          size="small"
                          className="flex items-center gap-2"
                        >
                          <Route className="w-4 h-4" />
                          Create Route
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConvertToItinerary()
                            addBanner('success', 'Converted to itinerary — opening planner...')
                          }}
                          variant="primary"
                          size="small"
                          className="flex items-center gap-2 bg-primary hover:bg-primary-600"
                        >
                          <Calendar className="w-4 h-4" />
                          Convert to Itinerary
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {loadingAroundMe && activeFilter === 'current-location' ? (
                <Card className="text-center py-16 min-h-[320px] flex flex-col items-center justify-center bg-secondary/20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-900 text-lg font-semibold mb-2">Finding places near you...</p>
                  <p className="text-gray-600 text-sm">Searching within {searchRadius} km radius</p>
                </Card>
              ) : filteredLocations.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6'
                      : viewMode === 'two-column'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4 pb-6'
                      : 'space-y-4 pb-6'
                  }
                  style={{ minHeight: '200px' }}
                >
                  {filteredLocations.map((location, index) => (
                    <LocationCard
                      key={`location-${location.id}-${index}`}
                      location={location}
                      index={index}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-16 min-h-[320px] flex flex-col items-center justify-center bg-secondary/20">
                  <MapPin className="w-16 h-16 text-primary/40 mb-4" />
                  <p className="text-gray-900 text-lg font-semibold mb-2">No locations found</p>
                  <p className="text-gray-600 text-sm mb-6 max-w-md">
                    {!discoverLocations || discoverLocations.length === 0
                      ? 'No locations available. Please check the data source.'
                      : `Try changing the filters or search. Found ${discoverLocations.length} total locations.`}
                  </p>
                  <Button
                    onClick={() => {
                      setActiveFilter('all')
                      setSearchQuery('')
                      setSelectedCategories([])
                      setMinReviews(0)
                      setMaxReviews(100000)
                    }}
                    variant="primary"
                    className="bg-primary hover:bg-primary-600"
                  >
                    Show All Locations
                  </Button>
                </Card>
              )}
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
