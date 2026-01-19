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
  // In a real app, this would use Google Maps API
  const listName = `Sololo Trip - ${new Date().toLocaleDateString()}`
  alert(`Creating Google Maps list: ${listName}\n\nThis would open Google Maps with ${locations.length} locations saved.`)
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
