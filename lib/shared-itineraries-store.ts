// Shared in-memory store for shared itineraries
// In production, this would be replaced with a database

interface SharedItinerary {
  id: string
  trip: any
  locations: any[]
  itinerary: any[]
  createdAt: number
  views: number
}

const sharedItineraries = new Map<string, SharedItinerary>()

// Generate a short, unique ID suitable for use in URLs
export function generateShareId(): string {
  // Try a few times to avoid collisions in the in-memory map
  for (let i = 0; i < 5; i++) {
    // Use current time + random to build a compact base36 token (7–9 chars)
    const timePart = Date.now().toString(36).slice(-4)
    const randomPart = Math.random().toString(36).slice(2, 6)
    const id = (timePart + randomPart).toLowerCase()

    if (!sharedItineraries.has(id)) {
      return id
    }
  }

  // Fallback: slightly longer ID if many collisions (very unlikely)
  let fallbackId: string
  do {
    fallbackId = Math.random().toString(36).slice(2, 10).toLowerCase()
  } while (sharedItineraries.has(fallbackId))

  return fallbackId
}

// Store a shared itinerary
export function storeSharedItinerary(data: Omit<SharedItinerary, 'id' | 'createdAt' | 'views'>): string {
  const shareId = generateShareId()
  const sharedData: SharedItinerary = {
    id: shareId,
    ...data,
    createdAt: Date.now(),
    views: 0,
  }

  sharedItineraries.set(shareId, sharedData)

  // Clean up old entries (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const [id, item] of sharedItineraries.entries()) {
    if (item.createdAt < thirtyDaysAgo) {
      sharedItineraries.delete(id)
    }
  }

  return shareId
}

// Get a shared itinerary
export function getSharedItinerary(shareId: string): SharedItinerary | null {
  const shared = sharedItineraries.get(shareId)
  if (!shared) return null

  // Increment views
  shared.views++
  return shared
}

// List all shared itineraries
export function listSharedItineraries(limit: number = 50): SharedItinerary[] {
  return Array.from(sharedItineraries.values())
    .sort((a, b) => b.createdAt - a.createdAt) // Most recent first
    .slice(0, limit)
}
