// Location utility functions

/**
 * Creates a properly formatted Google Maps location string
 * Coordinates should NOT be encoded, names/addresses should be encoded
 */
function formatLocationForUrl(location: { name: string; lat?: number; lng?: number; address?: string }): string {
  // If we have coordinates, use them directly (no encoding needed)
  if (location.lat != null && location.lng != null && 
      typeof location.lat === 'number' && typeof location.lng === 'number' &&
      !isNaN(location.lat) && !isNaN(location.lng)) {
    return `${location.lat},${location.lng}`
  }
  
  // Otherwise, use name or address and encode it
  const query = location.address || location.name
  return encodeURIComponent(query)
}

/**
 * Opens a location in Google Maps
 */
export function openInGoogleMaps(location: { name: string; lat?: number; lng?: number; address?: string }) {
  if (typeof window === 'undefined') return
  
  const locationStr = formatLocationForUrl(location)
  
  // Use coordinates format if we have them, otherwise use search format
  if (location.lat != null && location.lng != null && 
      typeof location.lat === 'number' && typeof location.lng === 'number' &&
      !isNaN(location.lat) && !isNaN(location.lng)) {
    window.open(`https://www.google.com/maps?q=${locationStr}`, '_blank')
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${locationStr}`, '_blank')
  }
}

export function createGoogleMapsList(
  locations: Array<{ name: string; lat?: number; lng?: number; address?: string }>,
  travelMode: 'walking' | 'driving' | 'bicycling' | 'transit' | 'mixed' = 'walking'
) {
  if (typeof window === 'undefined') return null
  
  if (locations.length === 0) {
    return null
  }

  // Single location - use simple search or coordinate format
  if (locations.length === 1) {
    const loc = locations[0]
    const locationStr = formatLocationForUrl(loc)
    
    if (loc.lat != null && loc.lng != null && 
        typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
        !isNaN(loc.lat) && !isNaN(loc.lng)) {
      return `https://www.google.com/maps?q=${locationStr}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${locationStr}`
  }

  // Multiple locations - create a directions URL
  // Use first location as origin, last as destination, and others as waypoints
  const origin = locations[0]
  const destination = locations[locations.length - 1]
  const waypoints = locations.slice(1, -1)

  const originStr = formatLocationForUrl(origin)
  const destStr = formatLocationForUrl(destination)

  let waypointsStr = ''
  if (waypoints.length > 0) {
    waypointsStr = waypoints.map(loc => formatLocationForUrl(loc)).join('|')
  }

  // Google Maps Directions URL with waypoints
  // Note: waypoints parameter should use | separator, and each waypoint should be properly formatted
  // Map 'mixed' mode to 'driving' for Google Maps (mixed isn't a valid mode)
  const googleMapsMode = travelMode === 'mixed' ? 'driving' : travelMode
  if (waypointsStr) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&waypoints=${waypointsStr}&travelmode=${googleMapsMode}`
  } else {
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=${googleMapsMode}`
  }
}

export function shareLocation(location: { name: string; address: string }) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  
  if (navigator.share) {
    navigator.share({
      title: location.name,
      text: `Check out ${location.name} at ${location.address}`,
      url: window.location.href,
    }).catch(() => {
      // Fallback to copy
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${location.name} - ${location.address}`)
        alert('Location link copied to clipboard!')
      }
    })
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${location.name} - ${location.address}`)
    alert('Location link copied to clipboard!')
  }
}

export function generateAlternativeLocation(currentLocation: { name: string; tags: string[] }) {
  // In a real app, this would call an API
  const alternatives = [
    { name: `${currentLocation.name} Alternative`, tags: currentLocation.tags },
    { name: `Nearby ${currentLocation.name}`, tags: currentLocation.tags },
    { name: `Similar to ${currentLocation.name}`, tags: currentLocation.tags },
  ]
  return alternatives[Math.floor(Math.random() * alternatives.length)]
}

/**
 * Creates a circular Google Maps route URL for multiple locations
 * The route will start and end at the first location, visiting all selected locations
 */
export function createCircularGoogleMapsRoute(
  locations: Array<{ name: string; lat?: number; lng?: number; address?: string }>,
  travelMode: 'walking' | 'driving' | 'bicycling' | 'transit' | 'mixed' = 'walking'
): string {
  if (locations.length === 0) {
    return 'https://www.google.com/maps'
  }

  if (locations.length === 1) {
    const loc = locations[0]
    const locationStr = formatLocationForUrl(loc)
    
    if (loc.lat != null && loc.lng != null && 
        typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
        !isNaN(loc.lat) && !isNaN(loc.lng)) {
      return `https://www.google.com/maps?q=${locationStr}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${locationStr}`
  }

  // For circular route, we need to:
  // 1. Use the first location as both origin and destination
  // 2. Add all other locations as waypoints
  const origin = locations[0]
  const waypoints = locations.slice(1)

  // Build waypoints string - properly format each waypoint
  const waypointQueries = waypoints.map(loc => formatLocationForUrl(loc)).join('|')

  // Build origin/destination - properly format
  const originStr = formatLocationForUrl(origin)

  // Google Maps Directions URL format:
  // https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=...
  // Map 'mixed' mode to 'driving' for Google Maps (mixed isn't a valid mode)
  const googleMapsMode = travelMode === 'mixed' ? 'driving' : travelMode
  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${originStr}&waypoints=${waypointQueries}&travelmode=${googleMapsMode}`
}

/**
 * Creates a simple Google Maps URL for a single location (coordinates or name)
 * Use this for creating links to locations
 */
export function createGoogleMapsUrl(location: { name: string; lat?: number; lng?: number; address?: string }): string {
  const locationStr = formatLocationForUrl(location)
  
  // Use coordinates format if we have them, otherwise use search format
  if (location.lat != null && location.lng != null && 
      typeof location.lat === 'number' && typeof location.lng === 'number' &&
      !isNaN(location.lat) && !isNaN(location.lng)) {
    return `https://www.google.com/maps?q=${locationStr}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${locationStr}`
}
