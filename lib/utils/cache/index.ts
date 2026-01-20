// Simple in-memory cache for API calls
// Cache expires after 1 hour by default

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 60 * 60 * 1000 // 1 hour

  // Generate cache key from parameters
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|')
    return `${prefix}|${sortedParams}`
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
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  // Clear cache
  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Generate cache key helper
  key(prefix: string, params: Record<string, any>): string {
    return this.generateKey(prefix, params)
  }

  // Get cache size (for debugging)
  size(): number {
    return this.cache.size
  }
}

// Create singleton instances for different API types
export const geminiCache = new SimpleCache()
export const mapsCache = new SimpleCache()

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    geminiCache.cleanup()
    mapsCache.cleanup()
  }, 10 * 60 * 1000)
}

// Re-export Supabase cache utilities
export * from './supabase'
