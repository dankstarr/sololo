# Supabase Query Caching

This document describes the in-memory caching system implemented to reduce redundant Supabase database queries.

## Overview

The caching system uses an in-memory cache (shared across all API route handlers in the same Node.js process) to avoid making duplicate Supabase queries. This significantly reduces database load and improves response times.

## Implementation

### Cache Utility (`lib/utils/supabase-cache.ts`)

A server-side singleton cache that:
- Stores query results in memory
- Automatically expires entries based on TTL (Time To Live)
- Supports cache invalidation when data changes
- Cleans up expired entries every 5 minutes

### Cache TTL (Time To Live)

Different endpoints have different cache durations based on how frequently data changes:

| Endpoint | TTL | Reason |
|----------|-----|--------|
| Groups List | 2 minutes | Groups change frequently |
| Shared Itineraries List | 2 minutes | New shares appear frequently |
| Shared Itinerary (single) | 5 minutes | Individual shares don't change |
| Cities List | 10 minutes | Cities don't change often |
| City Locations | 10 minutes | City locations are relatively static |

## Cached Endpoints

### 1. `/api/groups` (GET)

**Cached**: List of all groups  
**TTL**: 2 minutes  
**Invalidation**: When a new group is created (POST)

**Benefits**:
- Reduces database queries when multiple users view groups simultaneously
- Faster response times for group discovery

### 2. `/api/share/list` (GET)

**Cached**: List of shared itineraries  
**TTL**: 2 minutes  
**Invalidation**: When a new itinerary is shared (POST to `/api/share`)

**Benefits**:
- Reduces load on shared itineraries table
- Faster loading of discover page

### 3. `/api/share` (GET)

**Cached**: Individual shared itinerary by ID  
**TTL**: 5 minutes  
**Invalidation**: None (individual shares are read-only)

**Benefits**:
- Reduces queries for popular shared itineraries
- Faster share link loading

### 4. `/api/cities` (GET)

**Cached**: 
- List of all cities (with location counts)
- City locations by cityId

**TTL**: 10 minutes  
**Invalidation**: When cities/locations are created or updated (POST)

**Benefits**:
- Cities data is relatively static, so caching is very effective
- Reduces expensive location count queries

## Cache Invalidation

The cache automatically invalidates when data changes:

- **Groups**: Cache cleared when a new group is created
- **Shared Itineraries**: Cache cleared when a new itinerary is shared
- **Cities**: Cache cleared when cities or locations are updated

This ensures users always see fresh data after mutations while benefiting from caching for reads.

## How It Works

### Example Flow: GET /api/groups

1. **First Request**:
   ```
   Request → Check cache → Cache miss → Query Supabase → Store in cache → Return data
   ```

2. **Subsequent Requests** (within 2 minutes):
   ```
   Request → Check cache → Cache hit → Return cached data (no Supabase query!)
   ```

3. **After Cache Expires**:
   ```
   Request → Check cache → Expired → Query Supabase → Store in cache → Return data
   ```

4. **After Creating Group**:
   ```
   POST /api/groups → Create group → Invalidate cache → Return new group
   Next GET /api/groups → Cache miss → Query Supabase → Return fresh data
   ```

## Benefits

1. **Reduced Database Load**: Fewer queries to Supabase
2. **Faster Response Times**: Cached responses return instantly
3. **Lower Costs**: Reduced Supabase query usage
4. **Better Scalability**: Can handle more concurrent requests
5. **Improved UX**: Faster page loads

## Cache Statistics

The cache utility provides methods to monitor cache performance:

- `supabaseCache.size()` - Get number of cached entries
- `supabaseCache.cleanup()` - Manually clean expired entries

## Future Enhancements

- Add cache hit/miss metrics
- Implement Redis for distributed caching (if needed)
- Add cache warming for popular queries
- Cache user-specific queries (when auth is added)

## Notes

- Cache is **in-memory** and **process-specific** (not shared across multiple server instances)
- Cache is **automatically cleared** when the server restarts
- For production with multiple server instances, consider Redis or similar distributed cache
- Cache TTL values can be adjusted based on usage patterns
