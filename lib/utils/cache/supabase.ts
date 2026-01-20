// Server-side cache for Supabase queries
// This cache is shared across all API route handlers in the same Node.js process

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SupabaseCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  // Generate cache key from query parameters
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|')
    return `supabase:${prefix}|${sortedParams}`
  }

  // Get cached value
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Expired, remove from cache
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Set cached value
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  // Invalidate cache by prefix (useful when data changes)
  invalidate(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`supabase:${prefix}|`)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Generate cache key helper
  key(prefix: string, params: Record<string, any>): string {
    return this.generateKey(prefix, params)
  }

  // Get cache size (for debugging)
  size(): number {
    return this.cache.size
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton instance
const supabaseCache = new SupabaseCache()

// Cleanup expired entries every 5 minutes (only in Node.js environment)
if (typeof process !== 'undefined' && process.env && typeof setInterval !== 'undefined') {
  setInterval(() => {
    supabaseCache.cleanup()
  }, 5 * 60 * 1000)
}

export { supabaseCache }

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  GROUPS_LIST: 2 * 60 * 1000, // 2 minutes - groups change frequently
  SHARED_ITINERARIES_LIST: 2 * 60 * 1000, // 2 minutes - new shares appear frequently
  SHARED_ITINERARY: 5 * 60 * 1000, // 5 minutes - individual shares don't change
  CITIES_LIST: 10 * 60 * 1000, // 10 minutes - cities don't change often
  CITY_LOCATIONS: 10 * 60 * 1000, // 10 minutes - city locations don't change often
  GEocode: 24 * 60 * 60 * 1000, // 24 hours - addresses don't change
  DESTINATION_LOCATIONS: 7 * 24 * 60 * 60 * 1000, // 7 days - cached in DB
  PLACE_DETAILS: 30 * 60 * 1000, // 30 minutes - place details change infrequently
} as const
