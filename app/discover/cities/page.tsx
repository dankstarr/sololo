'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, Loader2, ExternalLink, Star, Calendar, TrendingUp, RefreshCw, Search, ArrowLeft } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Footer from '@/components/marketing/Footer'
import { SimpleMap } from '@/components/maps'
import { createGoogleMapsUrl } from '@/lib/utils/location'

interface City {
  id: string
  name: string
  country: string | null
  lat: number
  lng: number
  search_count: number
  is_major: boolean
  locationCount: number
  created_at?: string
  updated_at?: string
}

interface CityLocation {
  id: string
  name: string
  category: string
  rating?: number | null
  reviews?: number | null
  lat?: number | null
  lng?: number | null
  description?: string | null
  distance?: string | null
}

export default function DiscoverCitiesPage() {
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [cityLocations, setCityLocations] = useState<CityLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'locations' | 'searches' | 'recent'>('locations')
  const [filterMajor, setFilterMajor] = useState<boolean | null>(null) // null = all, true = major only, false = non-major only

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true)
      try {
        console.log('[Discover Cities] Fetching cities list')
        const res = await fetch('/api/cities')
        if (res.ok) {
          const data = await res.json()
          const citiesList = data.cities || []
          
          // Deduplicate cities
          const deduplicatedCities = citiesList.reduce((acc: City[], city: City) => {
            const key = `${city.name.toLowerCase().trim()}_${(city.country || '').toLowerCase().trim()}`
            const existingIndex = acc.findIndex(
              (c) => `${c.name.toLowerCase().trim()}_${(c.country || '').toLowerCase().trim()}` === key
            )
            
            if (existingIndex === -1) {
              acc.push(city)
            } else {
              const existing = acc[existingIndex]
              if (city.locationCount > existing.locationCount || 
                  (city.locationCount === existing.locationCount && city.search_count > existing.search_count)) {
                acc[existingIndex] = city
              }
            }
            
            return acc
          }, [])
          
          console.log(`[Discover Cities] Loaded ${deduplicatedCities.length} cities`)
          setCities(deduplicatedCities)
        } else {
          console.error(`[Discover Cities] Failed to fetch cities: ${res.status}`)
        }
      } catch (error) {
        console.error('[Discover Cities] Error fetching cities:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchCities()
  }, [])

  // Fetch locations for selected city
  useEffect(() => {
    if (!selectedCity) {
      setCityLocations([])
      setLoadingLocations(false)
      return
    }

    const fetchCityLocations = async () => {
      // Clear previous locations immediately when switching cities
      setCityLocations([])
      setLoadingLocations(true)
      
      try {
        console.log(`[Discover Cities] Fetching locations for city: ${selectedCity.name} (ID: ${selectedCity.id})`)
        const res = await fetch(`/api/cities?cityId=${selectedCity.id}`, {
          cache: 'no-store', // Ensure fresh data from database
        })
        
        if (res.ok) {
          const data = await res.json()
          const locations = data.locations || []
          console.log(`[Discover Cities] Loaded ${locations.length} locations for ${selectedCity.name}`, locations.length > 0 ? locations.slice(0, 3).map((l: any) => l.name) : 'No locations')
          setCityLocations(locations)
        } else {
          const errorText = await res.text().catch(() => 'Unknown error')
          console.error(`[Discover Cities] Failed to fetch locations for ${selectedCity.name}: ${res.status} - ${errorText}`)
          setCityLocations([])
        }
      } catch (error) {
        console.error(`[Discover Cities] Error fetching city locations for ${selectedCity.name}:`, error)
        setCityLocations([])
      } finally {
        setLoadingLocations(false)
      }
    }

    void fetchCityLocations()
  }, [selectedCity])

  // Filter and sort cities
  const filteredAndSortedCities = useMemo(() => {
    let filtered = [...cities]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(city => 
        city.name.toLowerCase().includes(query) ||
        (city.country && city.country.toLowerCase().includes(query))
      )
    }

    // Apply major filter
    if (filterMajor !== null) {
      filtered = filtered.filter(city => city.is_major === filterMajor)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.name}${a.country || ''}`.toLowerCase()
          const nameB = `${b.name}${b.country || ''}`.toLowerCase()
          return nameA.localeCompare(nameB)
        case 'locations':
          if (b.locationCount !== a.locationCount) {
            return b.locationCount - a.locationCount
          }
          return b.search_count - a.search_count
        case 'searches':
          if (b.search_count !== a.search_count) {
            return b.search_count - a.search_count
          }
          return b.locationCount - a.locationCount
        case 'recent':
          const dateA = a.updated_at || a.created_at || ''
          const dateB = b.updated_at || b.created_at || ''
          return dateB.localeCompare(dateA)
        default:
          return 0
      }
    })

    return sorted
  }, [cities, searchQuery, sortBy, filterMajor])

  // Get city URL for navigation
  const getCityUrl = (city: City) => {
    const params = new URLSearchParams()
    params.set('cityId', city.id)
    params.set('lat', city.lat.toString())
    params.set('lng', city.lng.toString())
    params.set('radius', '10')
    params.set('q', city.name + (city.country ? `, ${city.country}` : ''))
    return `/discover/locations?${params.toString()}`
  }

  // Get Google Maps URL - use centralized utility
  const getGoogleMapsUrl = (city: City) => {
    return createGoogleMapsUrl({
      name: city.name,
      lat: city.lat,
      lng: city.lng,
    })
  }

  // Map locations for selected city
  const mapLocations = useMemo(() => {
    if (!selectedCity) return []
    return cityLocations
      .filter(loc => loc.lat != null && loc.lng != null && typeof loc.lat === 'number' && typeof loc.lng === 'number')
      .map(loc => ({
        name: loc.name,
        lat: loc.lat as number,
        lng: loc.lng as number,
        category: loc.category,
      }))
  }, [selectedCity, cityLocations])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Loading cities...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-20 z-20">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => router.push('/discover')}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Discover
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Discover Cities
              </h1>
              <p className="text-gray-600">
                Explore {filteredAndSortedCities.length} cit{filteredAndSortedCities.length !== 1 ? 'ies' : 'y'} with saved locations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/discover/locations"
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm whitespace-nowrap"
              >
                View Locations
              </Link>
              <Link
                href="/app/home"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
              >
                Plan Trip
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-primary" />}
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="locations">Most Locations</option>
                <option value="searches">Most Searched</option>
                <option value="name">Name (A-Z)</option>
                <option value="recent">Recently Updated</option>
              </select>
              <div className="flex gap-2">
                <Button
                  variant={filterMajor === null ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setFilterMajor(null)}
                >
                  All
                </Button>
                <Button
                  variant={filterMajor === true ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setFilterMajor(true)}
                >
                  Major Only
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {filteredAndSortedCities.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cities found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try a different search term.' : 'Start searching for cities to see them appear here.'}
            </p>
            <Link
              href="/discover/locations"
              className="inline-block px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Search Locations
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cities List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredAndSortedCities.map((city) => (
                <Card
                  key={city.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedCity?.id === city.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCity(city)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {city.name}
                              {city.country && (
                                <span className="text-gray-600 font-normal">, {city.country}</span>
                              )}
                            </h3>
                            {city.is_major && (
                              <Badge variant="default" className="text-xs">
                                Major
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{city.locationCount} location{city.locationCount !== 1 ? 's' : ''}</span>
                            </div>
                            {city.search_count > 1 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>Searched {city.search_count}×</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coordinates */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📍 {city.lat.toFixed(4)}, {city.lng.toFixed(4)}</span>
                          {city.created_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Added {new Date(city.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={getCityUrl(city)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors text-center whitespace-nowrap"
                      >
                        View Locations
                      </Link>
                      <a
                        href={getGoogleMapsUrl(city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Google Maps
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Sidebar - Selected City Details */}
            <div className="lg:col-span-1">
              {selectedCity ? (
                <div key={selectedCity.id} className="sticky top-32">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">City Details</h2>
                      <button
                        onClick={() => setSelectedCity(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {selectedCity.name}
                          {selectedCity.country && `, ${selectedCity.country}`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{selectedCity.locationCount} locations</span>
                          {selectedCity.search_count > 1 && (
                            <span>{selectedCity.search_count} searches</span>
                          )}
                        </div>
                      </div>

                      {/* Map */}
                      {selectedCity.lat && selectedCity.lng && (
                        <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                          <SimpleMap
                            locations={[
                              {
                                name: selectedCity.name,
                                lat: selectedCity.lat,
                                lng: selectedCity.lng,
                                category: 'city',
                              },
                              ...mapLocations,
                            ]}
                            selectedDay={1}
                            showRoute={false}
                            travelMode="walking"
                          />
                        </div>
                      )}

                      {/* Top Locations */}
                      {loadingLocations ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="ml-2 text-gray-600">Loading locations...</span>
                        </div>
                      ) : cityLocations.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            All Locations ({cityLocations.length})
                          </h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {cityLocations.map((loc) => (
                              <div
                                key={loc.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {loc.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span>{loc.category}</span>
                                    {loc.rating && loc.rating > 0 && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                          <span>{typeof loc.rating === 'number' ? loc.rating.toFixed(1) : loc.rating}</span>
                                        </div>
                                      </>
                                    )}
                                    {loc.reviews && loc.reviews > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{typeof loc.reviews === 'number' ? loc.reviews.toLocaleString() : loc.reviews} reviews</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : selectedCity.locationCount > 0 && !loadingLocations ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">
                            No locations loaded ({selectedCity.locationCount} expected in database)
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Try clicking &quot;View All Locations&quot; to see them on the locations page.
                          </p>
                          <Link
                            href={getCityUrl(selectedCity)}
                            className="text-xs text-primary hover:underline"
                          >
                            View All Locations →
                          </Link>
                        </div>
                      ) : selectedCity.locationCount === 0 ? (
                        <p className="text-sm text-gray-600">No locations saved for this city yet.</p>
                      ) : null}

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <Link
                          href={getCityUrl(selectedCity)}
                          className="block w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors text-center"
                        >
                          View All Locations
                        </Link>
                        <a
                          href={getGoogleMapsUrl(selectedCity)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a City</h3>
                    <p className="text-sm text-gray-600">
                      Click on a city card to view details, map, and top locations
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
