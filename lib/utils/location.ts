// Location utility functions

export function openInGoogleMaps(location: { name: string; lat?: number; lng?: number; address?: string }) {
  if (typeof window === 'undefined') return
  
  if (location.lat && location.lng) {
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')
  } else if (location.address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`, '_blank')
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`, '_blank')
  }
}

export function createGoogleMapsList(locations: Array<{ name: string; lat?: number; lng?: number }>) {
  if (typeof window === 'undefined') return null
  
  if (locations.length === 0) {
    return null
  }

  // Create a Google Maps URL with all locations
  // Google Maps supports multiple locations in a single URL using the "place" parameter
  // Format: https://www.google.com/maps/search/?api=1&query=... for single location
  // For multiple locations, we'll create a directions URL with all locations as waypoints
  
  if (locations.length === 1) {
    const loc = locations[0]
    if (loc.lat && loc.lng) {
      return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}`
  }

  // For multiple locations, create a route with all locations
  // Use first location as origin, last as destination, and others as waypoints
  const origin = locations[0]
  const destination = locations[locations.length - 1]
  const waypoints = locations.slice(1, -1)

  let originStr: string
  if (origin.lat && origin.lng) {
    originStr = `${origin.lat},${origin.lng}`
  } else {
    originStr = encodeURIComponent(origin.name)
  }

  let destStr: string
  if (destination.lat && destination.lng) {
    destStr = `${destination.lat},${destination.lng}`
  } else {
    destStr = encodeURIComponent(destination.name)
  }

  let waypointsStr = ''
  if (waypoints.length > 0) {
    waypointsStr = waypoints.map(loc => {
      if (loc.lat && loc.lng) {
        return `${loc.lat},${loc.lng}`
      }
      return encodeURIComponent(loc.name)
    }).join('|')
  }

  // Google Maps Directions URL with waypoints
  if (waypointsStr) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&waypoints=${waypointsStr}&travelmode=walking`
  } else {
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=walking`
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
  locations: Array<{ name: string; lat?: number; lng?: number; address?: string }>
): string {
  if (locations.length === 0) {
    return 'https://www.google.com/maps'
  }

  if (locations.length === 1) {
    const loc = locations[0]
    if (loc.lat && loc.lng) {
      return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}`
  }

  // For circular route, we need to:
  // 1. Use the first location as both origin and destination
  // 2. Add all other locations as waypoints
  const origin = locations[0]
  const waypoints = locations.slice(1)

  // Build waypoints string
  const waypointQueries = waypoints.map(loc => {
    if (loc.lat && loc.lng) {
      return `${loc.lat},${loc.lng}`
    }
    return encodeURIComponent(loc.name)
  }).join('|')

  // Build origin/destination
  let originStr: string
  if (origin.lat && origin.lng) {
    originStr = `${origin.lat},${origin.lng}`
  } else {
    originStr = encodeURIComponent(origin.name)
  }

  // Google Maps Directions URL format:
  // https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=walking
  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${originStr}&waypoints=${waypointQueries}&travelmode=walking`
}
