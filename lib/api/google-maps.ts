// Google Maps API Integration
import { googleMaps } from '@/config/google-maps'
import { mapsCache } from '@/lib/utils/cache'
import { incrementHourlyUsage } from '@/lib/utils/api-usage'

interface Location {
  name: string
  lat: number
  lng: number
  category?: string
  rating?: number
  reviews?: number
  placeId?: string
}

// Track Google Maps API usage
interface MapsUsageStats {
  requestsToday: number
  requestsThisMinute: number
  lastRequestTime: number
  geocodeRequests: number
  placesRequests: number
  directionsRequests: number
  placeDetailsRequests: number
}

let mapsUsageStats: MapsUsageStats = {
  requestsToday: 0,
  requestsThisMinute: 0,
  lastRequestTime: 0,
  geocodeRequests: 0,
  placesRequests: 0,
  directionsRequests: 0,
  placeDetailsRequests: 0,
}

// Load usage stats from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('google_maps_usage_stats')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // Reset if it's a new day
      const today = new Date().toDateString()
      const savedDate = parsed.date
      if (savedDate === today) {
        mapsUsageStats = { ...parsed.stats, lastRequestTime: 0, requestsThisMinute: 0 }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

function saveMapsUsageStats() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'google_maps_usage_stats',
      JSON.stringify({
        date: new Date().toDateString(),
        stats: mapsUsageStats,
      })
    )
  }
}

function incrementMapsUsage(type: 'geocode' | 'places' | 'directions' | 'placeDetails') {
  checkMapsMinuteLimit()
  mapsUsageStats.requestsToday++
  mapsUsageStats.requestsThisMinute++
  mapsUsageStats.lastRequestTime = Date.now()
  // Power /admin hourly chart with real request volume
  incrementHourlyUsage(1)
  
  switch (type) {
    case 'geocode':
      mapsUsageStats.geocodeRequests++
      break
    case 'places':
      mapsUsageStats.placesRequests++
      break
    case 'directions':
      mapsUsageStats.directionsRequests++
      break
    case 'placeDetails':
      mapsUsageStats.placeDetailsRequests++
      break
  }
  
  saveMapsUsageStats()
}

// Reset minute counter if a minute has passed
function checkMapsMinuteLimit() {
  const now = Date.now()
  if (now - mapsUsageStats.lastRequestTime > 60000) {
    mapsUsageStats.requestsThisMinute = 0
    mapsUsageStats.lastRequestTime = now
  }
}

export function getMapsUsageStats(): MapsUsageStats {
  // Reload from localStorage to ensure we have the latest data
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('google_maps_usage_stats')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const today = new Date().toDateString()
        const savedDate = parsed.date
        if (savedDate === today) {
          // Update in-memory stats from localStorage
          mapsUsageStats = { 
            ...parsed.stats, 
            lastRequestTime: mapsUsageStats.lastRequestTime, 
            requestsThisMinute: mapsUsageStats.requestsThisMinute 
          }
        } else {
          // New day - reset stats
          mapsUsageStats = {
            requestsToday: 0,
            requestsThisMinute: 0,
            lastRequestTime: 0,
            geocodeRequests: 0,
            placesRequests: 0,
            directionsRequests: 0,
            placeDetailsRequests: 0,
          }
        }
      } catch (e) {
        console.warn('Error loading Google Maps usage stats from localStorage:', e)
      }
    }
  }
  checkMapsMinuteLimit()
  return { ...mapsUsageStats }
}

export function resetMapsUsageStats() {
  mapsUsageStats = {
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    geocodeRequests: 0,
    placesRequests: 0,
    directionsRequests: 0,
    placeDetailsRequests: 0,
  }
  saveMapsUsageStats()
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    formatted_address: string
  }>
  status: string
}

interface PlacesResponse {
  results: Array<{
    name: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    place_id: string
    types: string[]
    rating?: number
    user_ratings_total?: number
    photos?: Array<{
      photo_reference: string
    }>
    formatted_address?: string
  }>
  status: string
}

interface DirectionsResponse {
  routes: Array<{
    overview_polyline: {
      points: string
    }
    legs: Array<{
      distance: { text: string; value: number }
      duration: { text: string; value: number }
      steps: Array<{
        html_instructions: string
        distance: { text: string }
        duration: { text: string }
      }>
    }>
  }>
  status: string
}

// Geocode an address to get coordinates
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return null
  }

  // Check client-side cache first
  const cacheKey = mapsCache.key('geocode', { address })
  const cached = mapsCache.get<{ lat: number; lng: number; address: string }>(cacheKey)
  if (cached) {
    console.log('Geocode: Client cache hit')
    return cached
  }

  // Check Supabase cache
  try {
    const cacheResponse = await fetch(`/api/cache/geocode?address=${encodeURIComponent(address)}`)
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json()
      if (cacheData.cached) {
        console.log('Geocode: Supabase cache hit')
        const result = {
          lat: cacheData.lat,
          lng: cacheData.lng,
          address: cacheData.address,
        }
        // Also cache in client-side for faster subsequent access
        mapsCache.set(cacheKey, result, 24 * 60 * 60 * 1000)
        return result
      }
    }
  } catch (e) {
    console.warn('Error checking Supabase geocode cache:', e)
  }

  let didCall = false
  try {
    didCall = true
    const response = await fetch(`/api/google-maps/geocode?address=${encodeURIComponent(address)}`)
    const data: GeocodeResponse = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const geocodeResult = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address,
      }
      
      // Cache in client-side (24 hours)
      mapsCache.set(cacheKey, geocodeResult, 24 * 60 * 60 * 1000)
      
      // Cache in Supabase (best-effort, don't block on failure)
      try {
        await fetch('/api/cache/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            lat: geocodeResult.lat,
            lng: geocodeResult.lng,
            formatted_address: geocodeResult.address,
          }),
        })
      } catch (e) {
        console.warn('Failed to cache geocode in Supabase:', e)
      }
      
      return geocodeResult
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  } finally {
    // Track usage on any real attempt (success or failure). Cache hits return early above.
    if (didCall) incrementMapsUsage('geocode')
  }
}

// Search for places near a location
export async function searchPlaces(
  query: string,
  location: { lat: number; lng: number },
  radius: number = 5000,
  type?: string
): Promise<Location[]> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return []
  }

  // Check cache first
  const cacheKey = mapsCache.key('places', { query, lat: location.lat, lng: location.lng, radius, type })
  const cached = mapsCache.get<Location[]>(cacheKey)
  if (cached) {
    return cached
  }

  let didCall = false
  try {
    let url = `/api/google-maps/places?query=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}&radius=${radius}`
    
    if (type) {
      url += `&type=${type}`
    }

    didCall = true
    const response = await fetch(url)
    const data: PlacesResponse = await response.json()

    if (data.status === 'OK') {
      // Return up to 20 results (Google Places API returns max 20 per request)
      const results = data.results.slice(0, 20).map((place) => {
        // Log sample to verify API response
        if (data.results.indexOf(place) === 0) {
          console.log(`[API] Google Places Text Search response for "${place.name}":`, {
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            place_id: place.place_id,
          })
        }
        
        return {
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          category: place.types[0],
          rating: place.rating !== undefined && place.rating !== null ? place.rating : undefined,
          reviews: place.user_ratings_total !== undefined && place.user_ratings_total !== null ? place.user_ratings_total : undefined,
          placeId: place.place_id,
        }
      })
      
      // Cache the result (cache for 6 hours - places don't change frequently, reduces API calls)
      mapsCache.set(cacheKey, results, 6 * 60 * 60 * 1000)
      
      return results
    }

    if (data.status === 'ZERO_RESULTS') {
      // Cache empty results for shorter time (5 minutes) to avoid repeated failed queries
      mapsCache.set(cacheKey, [], 5 * 60 * 1000)
      return []
    }

    console.warn(`Places API returned status: ${data.status} for query: ${query}`)
    return []
  } catch (error) {
    console.error('Places search error:', error)
    return []
  } finally {
    if (didCall) incrementMapsUsage('places')
  }
}

// Get directions between locations
export async function getDirections(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  waypoints?: Array<{ lat: number; lng: number }>,
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'walking'
): Promise<{
  route: string
  distance: string
  duration: string
  steps: Array<{ instruction: string; distance: string; duration: string }>
} | null> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return null
  }

  // Check cache first
  const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`
  const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`
  const waypointStr = waypoints?.map(wp => `${wp.lat},${wp.lng}`).join('|') || ''
  
  const cacheKey = mapsCache.key('directions', { origin: originStr, destination: destStr, waypoints: waypointStr, travelMode })
  const cached = mapsCache.get<{ route: string; distance: string; duration: string; steps: Array<{ instruction: string; distance: string; duration: string }> }>(cacheKey)
  if (cached) {
    console.log('Directions: Cache hit')
    return cached
  }

  let didCall = false
  try {
    let url = `/api/google-maps/directions?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=${travelMode}`
    
    if (waypoints && waypoints.length > 0) {
      url += `&waypoints=${encodeURIComponent(waypointStr)}`
    }

    didCall = true
    const response = await fetch(url)
    const data: DirectionsResponse = await response.json()

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0]
      const leg = route.legs[0]
      
      const directionsResult = {
        route: route.overview_polyline.points,
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map((step) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
        })),
      }
      
      // Cache the result (cache for 1 hour - routes can change due to traffic)
      mapsCache.set(cacheKey, directionsResult, 60 * 60 * 1000)
      
      return directionsResult
    }

    return null
  } catch (error) {
    console.error('Directions error:', error)
    return null
  } finally {
    if (didCall) incrementMapsUsage('directions')
  }
}

export async function findPlaceIdByText(
  query: string,
  location: { lat: number; lng: number },
  radius: number = 20000
): Promise<string | null> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return null
  }

  const cacheKey = mapsCache.key('placeIdByText', { query, lat: location.lat, lng: location.lng, radius })
  const cached = mapsCache.get<string | null>(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  let didCall = false
  try {
    didCall = true
    const response = await fetch(
      `/api/google-maps/places?query=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}&radius=${radius}`
    )
    const data: PlacesResponse = await response.json()

    console.log(`[findPlaceIdByText] Query: "${query}", Status: ${data.status}, Results: ${data.results?.length || 0}`)
    
    if (data.status === 'OK' && data.results.length > 0) {
      // Try to find exact match first (case-insensitive)
      const exactMatch = data.results.find(r => 
        r.name.toLowerCase().trim() === query.split(',')[0].toLowerCase().trim()
      )
      const placeId = exactMatch?.place_id || data.results[0].place_id
      
      console.log(`[findPlaceIdByText] ✅ Found place_id: ${placeId} for "${query}"`)
      mapsCache.set(cacheKey, placeId, 24 * 60 * 60 * 1000)
      return placeId
    }

    if (data.status === 'ZERO_RESULTS') {
      console.warn(`[findPlaceIdByText] ❌ ZERO_RESULTS for query: "${query}"`)
      mapsCache.set(cacheKey, null, 6 * 60 * 60 * 1000)
      return null
    }

    // Log other statuses for debugging
    if (data.status !== 'OK') {
      console.warn(`[findPlaceIdByText] ❌ Status: ${data.status} for query: "${query}"`, (data as any).error_message || '')
    }

    return null
  } catch (error) {
    console.error('findPlaceIdByText error:', error)
    return null
  } finally {
    if (didCall) incrementMapsUsage('places')
  }
}

// Get autocomplete suggestions for a location query
export async function getAutocompleteSuggestions(
  input: string,
  location?: { lat: number; lng: number }
): Promise<Array<{ description: string; placeId: string }>> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return []
  }

  if (!input || input.trim().length < 2) {
    return []
  }

  // Check cache first
  const locationStr = location ? `${location.lat},${location.lng}` : 'global'
  const cacheKey = mapsCache.key('autocomplete', { input: input.trim().toLowerCase(), location: locationStr })
  const cached = mapsCache.get<Array<{ description: string; placeId: string }>>(cacheKey)
  if (cached) {
    return cached
  }

  let didCall = false
  try {
    let url = `/api/google-maps/autocomplete?input=${encodeURIComponent(input)}`
    
    if (location) {
      url += `&location=${location.lat},${location.lng}`
    }

    didCall = true
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.predictions) {
      const results = data.predictions.slice(0, 8).map((prediction: any) => ({
        description: prediction.description,
        placeId: prediction.place_id,
      }))
      
      // Cache the result (cache for 1 hour - autocomplete queries change frequently)
      mapsCache.set(cacheKey, results, 60 * 60 * 1000)
      
      return results
    }

    if (data.status === 'ZERO_RESULTS') {
      // Cache empty results for shorter time (5 minutes)
      mapsCache.set(cacheKey, [], 5 * 60 * 1000)
      return []
    }

    console.warn(`Autocomplete API returned status: ${data.status}`)
    return []
  } catch (error) {
    console.error('Autocomplete error:', error)
    return []
  } finally {
    if (didCall) incrementMapsUsage('places')
  }
}

// Get place details
export async function getPlaceDetails(placeId: string): Promise<{
  name: string
  address: string
  phone?: string
  website?: string
  openingHours?: string[]
  rating?: number
  photos?: string[]
  reviews?: number
  priceLevel?: number
  types?: string[]
  googleMapsUrl?: string
  description?: string
} | null> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return null
  }

  // Check client-side cache first
  const cacheKey = mapsCache.key('placeDetails', { placeId })
  const cached = mapsCache.get<{
    name: string
    address: string
    phone?: string
    website?: string
    openingHours?: string[]
    rating?: number
    photos?: string[]
    reviews?: number
    priceLevel?: number
    types?: string[]
    googleMapsUrl?: string
    description?: string
  } | null>(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  // Check Supabase cache
  try {
    const cacheResponse = await fetch(`/api/cache/place-details?place_id=${encodeURIComponent(placeId)}`)
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json()
      if (cacheData.cached) {
        console.log('Place details: Supabase cache hit')
        const details = cacheData.details
        // Also cache in client-side
        mapsCache.set(cacheKey, details, 30 * 24 * 60 * 60 * 1000) // 30 days
        return details
      }
    }
  } catch (e) {
    console.warn('Error checking Supabase place details cache:', e)
  }

  let didCall = false
  try {
    didCall = true
    const response = await fetch(
      `/api/google-maps/place-details?place_id=${placeId}`
    )

    const data = await response.json()

    console.log(`[getPlaceDetails] Status: ${data.status} for place_id: ${placeId}`)
    
    if (data.status === 'OK' && data.result) {
      const details = {
        name: data.result.name,
        address: data.result.formatted_address,
        phone: data.result.formatted_phone_number,
        website: data.result.website,
        openingHours: data.result.opening_hours?.weekday_text,
        rating: data.result.rating,
        reviews: data.result.user_ratings_total,
        priceLevel: data.result.price_level,
        types: data.result.types,
        googleMapsUrl: data.result.url,
        description: data.result.editorial_summary?.overview,
        photos: data.result.photos?.slice(0, 5).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${googleMaps.apiKey}`
        ),
      }

      // Cache in client-side (24 hours)
      mapsCache.set(cacheKey, details, 24 * 60 * 60 * 1000)
      
      // Cache in Supabase (best-effort, don't block on failure)
      try {
        await fetch('/api/cache/place-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: placeId,
            details,
          }),
        })
      } catch (e) {
        console.warn('Failed to cache place details in Supabase:', e)
      }
      
      return details
    }

    // Handle different error statuses
    if (data.status === 'NOT_FOUND') {
      console.warn(`[getPlaceDetails] ❌ Place not found for place_id: ${placeId}`)
      mapsCache.set(cacheKey, null, 6 * 60 * 60 * 1000) // Cache negative result
      return null
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.warn(`[getPlaceDetails] ❌ Zero results for place_id: ${placeId}`)
      mapsCache.set(cacheKey, null, 6 * 60 * 60 * 1000) // Cache negative result
      return null
    }
    
    if (data.status && data.status !== 'OK') {
      console.warn(`[getPlaceDetails] ❌ Status: ${data.status} for place_id: ${placeId}`, (data as any).error_message || '')
    }

    mapsCache.set(cacheKey, null, 6 * 60 * 60 * 1000)
    return null
  } catch (error) {
    console.error('Place details error:', error)
    return null
  } finally {
    if (didCall) incrementMapsUsage('placeDetails')
  }
}

// Generate optimized route (circular route)
export async function generateCircularRoute(
  locations: Location[],
  startLocation: Location
): Promise<Location[]> {
  if (locations.length === 0) return []

  // Simple optimization: find nearest neighbor for each location
  // In production, use more sophisticated algorithms
  const optimized: Location[] = [startLocation]
  const remaining = [...locations]

  let current = startLocation

  while (remaining.length > 0) {
    let nearest = remaining[0]
    let minDistance = getDistance(current, nearest)

    for (const loc of remaining) {
      const dist = getDistance(current, loc)
      if (dist < minDistance) {
        minDistance = dist
        nearest = loc
      }
    }

    optimized.push(nearest)
    remaining.splice(remaining.indexOf(nearest), 1)
    current = nearest
  }

  // Return to start
  optimized.push(startLocation)

  return optimized
}

// Calculate distance between two points (Haversine formula)
function getDistance(loc1: Location, loc2: Location): number {
  const R = 6371 // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180)
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
