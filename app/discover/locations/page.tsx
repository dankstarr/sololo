'use client'

import { useState, useEffect, useMemo } from 'react'
import { m } from 'framer-motion'
import { Search, MapPin, Star, Filter, ArrowLeft, Map as MapIcon, ExternalLink, Navigation, X, Check, Route, Calendar } from 'lucide-react'
import { 
  Input, 
  Badge, 
  Card,
  Button,
} from '@/components/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { discoverLocations, DiscoverLocation } from '@/config/discover-locations'
import { getImageUrl } from '@/lib/utils'
import { openInGoogleMaps, createCircularGoogleMapsRoute } from '@/lib/utils/location'
import { geocodeAddress } from '@/lib/api/google-maps'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'
import { SimpleMap } from '@/components/maps'
import { useAppStore } from '@/store/useAppStore'
import { Location } from '@/types'
import { useDebounce } from '@/hooks'

type SortType = 'best' | 'top-rated' | 'most-reviewed' | 'hidden-gems' | 'worst-rated' | 'recently-discovered'
type FilterType = 'all' | 'current-location' | 'best' | 'top-rated' | 'hidden-gems'

// Extended location interface with coordinates
interface LocationWithCoords extends DiscoverLocation {
  lat?: number
  lng?: number
  selected?: boolean
}

export default function TopLocationsPage() {
  const router = useRouter()
  const { setSelectedLocations, setItinerary, setCurrentTrip } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // 500ms debounce
  const [activeFilter, setActiveFilter] = useState<FilterType>('top-rated')
  const [sortBy, setSortBy] = useState<SortType>('top-rated')
  const [searchRadius, setSearchRadius] = useState(5) // km
  const [minReviews, setMinReviews] = useState(0)
  const [maxReviews, setMaxReviews] = useState(100000)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('My Current Location')
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set())
  const [locationCoords, setLocationCoords] = useState<Map<string, { lat: number; lng: number }>>(new Map())

  // Get user's current location
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
          setLocationName('London, UK') // Fallback
        }
      )
    }
  }, [activeFilter])

  // Get all unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    discoverLocations.forEach(loc => {
      if (loc.category) categories.add(loc.category)
    })
    return Array.from(categories).sort()
  }, [])

  // Debug: Log locations data
  useEffect(() => {
    console.log('Discover locations:', discoverLocations?.length || 0, 'locations loaded')
    if (discoverLocations && discoverLocations.length > 0) {
      console.log('Sample location:', discoverLocations[0])
      console.log('Locations with rating >= 4.6:', discoverLocations.filter(loc => loc.rating >= 4.6).length)
    }
  }, [])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Format reviews
  const formatReviews = (count: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(count)
  }

  // Parse distance string to number (km)
  const parseDistance = (distanceStr: string): number => {
    const match = distanceStr.match(/(\d+\.?\d*)\s*(km|m)/i)
    if (!match) return 0
    const value = parseFloat(match[1])
    return match[2].toLowerCase() === 'km' ? value : value / 1000
  }

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    // Ensure discoverLocations is an array
    if (!discoverLocations || !Array.isArray(discoverLocations) || discoverLocations.length === 0) {
      console.warn('discoverLocations is empty or not an array', discoverLocations)
      return []
    }

    console.log('Filtering locations:', discoverLocations.length, 'total locations')

    let filtered = [...discoverLocations]

    // Apply search filter (using debounced query to avoid spammy API calls)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          loc.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          loc.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(loc => selectedCategories.includes(loc.category))
    }

    // Apply review count filter
    filtered = filtered.filter(loc => loc.reviews >= minReviews && loc.reviews <= maxReviews)

    // Apply distance filter (if using current location)
    if (activeFilter === 'current-location' && userLocation && searchRadius > 0) {
      // For demo, we'll filter by distance string parsing
      // In production, calculate actual distance from user location
      filtered = filtered.filter(loc => {
        const distance = parseDistance(loc.distance)
        return distance <= searchRadius
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

    // Sort locations
    let sorted = [...filtered]
    switch (sortBy) {
      case 'best':
        // Combined score: rating * 0.6 + (normalized reviews) * 0.4
        sorted = sorted.sort((a, b) => {
          const scoreA = a.rating * 0.6 + Math.min(a.reviews / 10000, 1) * 0.4
          const scoreB = b.rating * 0.6 + Math.min(b.reviews / 10000, 1) * 0.4
          return scoreB - scoreA
        })
        break
      case 'top-rated':
        sorted = sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'most-reviewed':
        sorted = sorted.sort((a, b) => b.reviews - a.reviews)
        break
      case 'hidden-gems':
        sorted = sorted.filter(loc => loc.reviews < 5000 && loc.rating >= 4.5)
          .sort((a, b) => b.rating - a.rating)
        break
      case 'worst-rated':
        sorted = sorted.sort((a, b) => a.rating - b.rating)
        break
      case 'recently-discovered':
        // Sort by ID (newer IDs = more recent)
        sorted = sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        break
    }

    console.log('Filtered locations:', sorted.length, 'locations found')
    return sorted
  }, [debouncedSearchQuery, activeFilter, sortBy, searchRadius, minReviews, maxReviews, selectedCategories, userLocation])

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

  // Geocode selected locations when they're selected
  useEffect(() => {
    const geocodeLocations = async () => {
      const toGeocode = filteredLocations.filter(
        loc => selectedLocationIds.has(loc.id) && !locationCoords.has(loc.id)
      )

      if (toGeocode.length === 0) return

      for (const loc of toGeocode) {
        try {
          const coords = await geocodeAddress(`${loc.name}, London, UK`)
          if (coords) {
            setLocationCoords(prev => {
              const newMap = new Map(prev)
              newMap.set(loc.id, { lat: coords.lat, lng: coords.lng })
              return newMap
            })
          }
        } catch (error) {
          console.error(`Error geocoding ${loc.name}:`, error)
        }
      }
    }

    geocodeLocations()
  }, [selectedLocationIds, filteredLocations, locationCoords])

  // Create circular Google Maps route
  const handleCreateCircularRoute = () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location')
      return
    }

    const routeUrl = createCircularGoogleMapsRoute(selectedLocations)
    window.open(routeUrl, '_blank')
  }

  // Convert to itinerary
  const handleConvertToItinerary = () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location')
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

    // Create itinerary days
    const daysCount = Math.ceil(locations.length / 3)
    const locationsPerDay = Math.ceil(locations.length / daysCount)
    const itineraryDays = []

    for (let i = 0; i < daysCount; i++) {
      const dayLocations = locations.slice(i * locationsPerDay, (i + 1) * locationsPerDay)
      itineraryDays.push({
        id: String(i + 1),
        day: i + 1,
        locations: dayLocations.map(loc => loc.name),
        estimatedTime: `${dayLocations.length * 2}-${dayLocations.length * 3} hours`,
        distance: `${(dayLocations.length * 1.5).toFixed(1)} km`,
        pace: 'balanced' as const,
        notes: '',
        budget: `$${dayLocations.length * 20}-${dayLocations.length * 40}`,
      })
    }

    // Save to store
    setCurrentTrip(tripData)
    setSelectedLocations(locations)
    setItinerary(itineraryDays)

    // Navigate to itinerary page
    router.push('/app/itinerary')
  }

  // Convert locations to map format (with mock coordinates for demo)
  const mapLocations = useMemo(() => {
    // For demo, use London coordinates with slight variations
    const baseLat = 51.5074
    const baseLng = -0.1278
    
    return filteredLocations.map((loc, index) => {
      const coords = locationCoords.get(loc.id)
      return {
        name: loc.name,
        lat: coords?.lat || baseLat + (Math.random() - 0.5) * 0.1,
        lng: coords?.lng || baseLng + (Math.random() - 0.5) * 0.1,
        category: loc.category.toLowerCase().replace(/\s+/g, '-'),
      }
    })
  }, [filteredLocations, locationCoords])

  const LocationCard = ({ location, index }: { location: DiscoverLocation; index: number }) => {
    const isHighRated = location.rating > 4.7
    const isSelected = selectedLocationIds.has(location.id)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ', London, UK')}`

    return (
      <m.div
        className="cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => toggleLocationSelection(location.id)}
      >
        <Card 
          className={`overflow-hidden relative border-2 transition-all ${
            isSelected 
              ? 'border-primary shadow-xl ring-2 ring-primary/20' 
              : 'border-gray-200 hover:border-primary/50'
          }`}
          hover
          padding="none"
        >
          {/* Selection Checkbox - Top Left */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLocationSelection(location.id)
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                isSelected
                  ? 'bg-primary text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400 hover:border-primary/50'
              }`}
            >
              {isSelected && <Check className="w-5 h-5" />}
            </button>
          </div>

          {/* Review Count Badge - Top Right */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Badge variant="default" className="bg-primary text-white font-semibold shadow-md">
              {formatReviews(location.reviews)}
            </Badge>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white rounded-full shadow-md hover:bg-secondary transition-colors"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
            </a>
          </div>

          <div className="flex gap-4 p-6 pl-16">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md">
                #{index + 1}
              </div>
            </div>

            {/* Image */}
            <div className="w-28 h-28 rounded-2xl bg-gray-200 flex-shrink-0 overflow-hidden relative shadow-md">
              <Image
                src={getImageUrl(location.image, 'location')}
                alt={location.name}
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{location.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs bg-secondary/50 border-primary/20 text-primary">
                      {location.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{location.description}</p>
              
              {/* Rating and Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{location.rating}</span>
                  <span className="text-xs text-gray-500">
                    ({formatReviews(location.reviews)})
                  </span>
                </div>
                
                {isHighRated && (
                  <m.span
                    className="text-xs text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ⭐ Top Rated
                  </m.span>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{location.distance} away</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </m.div>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen bg-background pt-20">
      {/* Page Header */}
      <header className="sticky top-20 z-20 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-5">
        <div className="container mx-auto">
          <div className="flex items-start gap-4 mb-5">
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
                  ? 'Discover the best rated places in My Current Location, curated using our unique algorithm blending Top Rated and Most Reviewed establishments.'
                  : 'Discover the best places to visit'}
              </p>
            </div>
            <Button
              onClick={() => setShowMap(!showMap)}
              variant={showMap ? 'primary' : 'outline'}
              className={`flex items-center gap-2 shrink-0 ${
                showMap ? 'bg-primary hover:bg-primary-600' : ''
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'Show Map'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-primary" />}
                className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="w-4 h-4 text-primary" />
            {(['all', 'current-location', 'best', 'top-rated', 'hidden-gems'] as FilterType[]).map((filter) => (
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
                  ? '📍 My Current Location'
                  : filter === 'best' 
                  ? '🔥 Best' 
                  : filter === 'top-rated' 
                  ? '🏆 Top Rated' 
                  : '💎 Hidden Gems'}
              </Badge>
            ))}
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Sort Results By</p>
            <ToggleGroup type="single" value={sortBy} onValueChange={(v) => v && setSortBy(v as SortType)} className="flex-wrap gap-2">
              <ToggleGroupItem value="best" aria-label="Best" className="rounded-full">
                🔥 Best
              </ToggleGroupItem>
              <ToggleGroupItem value="top-rated" aria-label="Top rated" className="rounded-full">
                🏆 Top rated
              </ToggleGroupItem>
              <ToggleGroupItem value="most-reviewed" aria-label="Most reviewed" className="rounded-full">
                🤩 Most reviewed
              </ToggleGroupItem>
              <ToggleGroupItem value="hidden-gems" aria-label="Hidden gems" className="rounded-full">
                💎 Hidden gems
              </ToggleGroupItem>
              <ToggleGroupItem value="worst-rated" aria-label="Worst rated" className="rounded-full">
                🤬 Worst rated
              </ToggleGroupItem>
              <ToggleGroupItem value="recently-discovered" aria-label="Recently discovered" className="rounded-full">
                🆕 Recently discovered
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Search Radius (for current location) */}
          {activeFilter === 'current-location' && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-900 mb-2">Search Radius</p>
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
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">Number of Reviews</p>
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
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">Categories</p>
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
                    setSelectedCategories(prev =>
                      prev.includes(category)
                        ? prev.filter(c => c !== category)
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
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 bg-background">
        {/* Map View */}
        {showMap && (
          <Card className="mb-6 h-96 overflow-hidden border-2 border-gray-200 shadow-lg relative" padding="none">
            {mapLocations.length > 0 ? (
              <SimpleMap
                locations={mapLocations}
                selectedDay={1}
                showRoute={false}
                onLocationClick={(loc) => {
                  const location = filteredLocations.find(l => l.name === loc.name)
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
        )}

        {/* Results Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {filteredLocations.length} {activeFilter === 'all' ? 'locations' : activeFilter === 'best' ? 'best locations' : activeFilter === 'top-rated' ? 'top-rated locations' : activeFilter === 'current-location' ? 'locations near you' : 'hidden gems'}
              </h2>
              {selectedLocationIds.size > 0 && (
                <p className="text-sm text-primary font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {selectedLocationIds.size} location{selectedLocationIds.size !== 1 ? 's' : ''} selected
                </p>
              )}
              {activeFilter === 'current-location' && (
                <p className="text-xs text-gray-500 mt-2">
                  Please note that certain place categories are intentionally excluded to ensure a refined selection.
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {selectedLocationIds.size > 0 && (
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCreateCircularRoute()
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Route className="w-4 h-4" />
                  Create Route
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleConvertToItinerary()
                  }}
                  variant="primary"
                  className="flex items-center gap-2 bg-primary hover:bg-primary-600"
                >
                  <Calendar className="w-4 h-4" />
                  Convert to Itinerary
                </Button>
              </div>
            )}
          </div>
        </div>

        {filteredLocations.length > 0 ? (
          <div className="space-y-4 pb-6">
            {filteredLocations.map((location, index) => (
              <LocationCard key={location.id} location={location} index={index} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 min-h-[400px] flex flex-col items-center justify-center bg-secondary/20">
            <MapPin className="w-16 h-16 text-primary/40 mb-4" />
            <p className="text-gray-900 text-lg font-semibold mb-2">No locations found</p>
            <p className="text-gray-600 text-sm mb-6 max-w-md">
              {!discoverLocations || discoverLocations.length === 0 
                ? 'No locations available. Please check the data source.'
                : `Try changing the filter or search. Found ${discoverLocations.length} total locations.`}
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
      </div>
      </div>
      <Footer />
    </main>
  )
}
