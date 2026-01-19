// Google Maps API Integration
import { googleMaps } from '@/config/google-maps'
import { mapsCache } from '@/lib/utils/cache'

interface Location {
  name: string
  lat: number
  lng: number
  category?: string
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
    photos?: Array<{
      photo_reference: string
    }>
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

  // Check cache first
  const cacheKey = mapsCache.key('geocode', { address })
  const cached = mapsCache.get<{ lat: number; lng: number; address: string }>(cacheKey)
  if (cached) {
    console.log('Geocode: Cache hit')
    return cached
  }

  try {
    const response = await fetch(
      `/api/google-maps/geocode?address=${encodeURIComponent(address)}`
    )

    const data: GeocodeResponse = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const geocodeResult = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address,
      }
      
      // Cache the result (cache for 24 hours - addresses don't change often)
      mapsCache.set(cacheKey, geocodeResult, 24 * 60 * 60 * 1000)
      
      return geocodeResult
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
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
    console.log('Places search: Cache hit')
    return cached
  }

  try {
    let url = `/api/google-maps/places?query=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}&radius=${radius}`
    
    if (type) {
      url += `&type=${type}`
    }

    const response = await fetch(url)
    const data: PlacesResponse = await response.json()

    if (data.status === 'OK') {
      // Return up to 20 results (Google Places API returns max 20 per request)
      const results = data.results.slice(0, 20).map((place) => ({
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        category: place.types[0],
      }))
      
      // Cache the result (cache for 1 hour - places can change)
      mapsCache.set(cacheKey, results, 60 * 60 * 1000)
      
      return results
    }

    if (data.status === 'ZERO_RESULTS') {
      console.log(`No results for query: ${query}`)
      // Cache empty results for shorter time (5 minutes) to avoid repeated failed queries
      mapsCache.set(cacheKey, [], 5 * 60 * 1000)
      return []
    }

    console.warn(`Places API returned status: ${data.status} for query: ${query}`)
    return []
  } catch (error) {
    console.error('Places search error:', error)
    return []
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

  try {
    let url = `/api/google-maps/directions?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=${travelMode}`
    
    if (waypoints && waypoints.length > 0) {
      url += `&waypoints=${encodeURIComponent(waypointStr)}`
    }

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
} | null> {
  if (!googleMaps.enabled || !googleMaps.apiKey) {
    console.warn('Google Maps API not configured')
    return null
  }

  try {
    const response = await fetch(
      `/api/google-maps/place-details?place_id=${placeId}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.result) {
      return {
        name: data.result.name,
        address: data.result.formatted_address,
        phone: data.result.formatted_phone_number,
        website: data.result.website,
        openingHours: data.result.opening_hours?.weekday_text,
        rating: data.result.rating,
        photos: data.result.photos?.slice(0, 5).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${googleMaps.apiKey}`
        ),
      }
    }

    return null
  } catch (error) {
    console.error('Place details error:', error)
    return null
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
