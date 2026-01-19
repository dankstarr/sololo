# Supabase Caching System

This document describes the Supabase-based caching system implemented to reduce API calls for Google Maps and location searches.

## Overview

The caching system stores frequently accessed data in Supabase to:
- Reduce Google Maps API calls (geocoding, place searches, place details)
- Speed up location searches for popular destinations (e.g., "London")
- Persist cache across sessions and users
- Lower API costs

## Cached Data Types

### 1. Geocode Cache (`geocode_cache`)

**Purpose**: Cache address-to-coordinates lookups (e.g., "London" → lat/lng)

**Cache Duration**: Permanent (addresses don't change)

**Usage**:
- When `geocodeAddress()` is called, it checks Supabase cache first
- If found, returns cached coordinates immediately
- If not found, calls Google Maps API and stores result in cache

**API Routes**:
- `GET /api/cache/geocode?address=...` - Check cache
- `POST /api/cache/geocode` - Store geocode result

### 2. Destination Locations Cache (`destination_locations_cache`)

**Purpose**: Cache complete location lists for destinations (e.g., "London" → 25 locations)

**Cache Duration**: 7 days (locations may change over time)

**Cache Key**: Combination of:
- Destination name (e.g., "London")
- Number of days (optional)
- Interests array (optional)

**Usage**:
- When `LocationSelection` component loads, it checks cache first
- If cached locations found, displays them immediately (no API calls)
- If not found, performs full search and caches results

**API Routes**:
- `GET /api/cache/destination-locations?destination=...&days=...&interests=...` - Check cache
- `POST /api/cache/destination-locations` - Store location list

### 3. Place Details Cache (`place_details_cache`)

**Purpose**: Cache enriched place information (photos, reviews, hours, etc.)

**Cache Duration**: 30 days (place details change infrequently)

**Usage**:
- When `getPlaceDetails()` is called, checks Supabase cache first
- If found, returns cached details immediately
- If not found, calls Google Maps API and stores result

**API Routes**:
- `GET /api/cache/place-details?place_id=...` - Check cache
- `POST /api/cache/place-details` - Store place details

### 4. Top Location Results Cache (`top_location_results`)

**Purpose**: Cache "around me" search results (already implemented)

**Cache Duration**: Permanent (until manually refreshed)

**Usage**: Used by `/app/discover/locations` page for "around me" searches

## Database Schema

All caching tables are defined in `supabase/schema.sql`:

```sql
-- Geocode cache
create table public.geocode_cache (
  id uuid primary key,
  address text unique not null,
  lat numeric not null,
  lng numeric not null,
  formatted_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Destination locations cache
create table public.destination_locations_cache (
  id uuid primary key,
  destination text not null,
  days integer null,
  interests text[] null,
  locations jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Place details cache
create table public.place_details_cache (
  id uuid primary key,
  place_id text unique not null,
  details jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Implementation Details

### Client-Side Caching (Layered)

The system uses a two-tier caching approach:

1. **Client-side cache** (in-memory, session-based)
   - Fastest access
   - Cleared on page refresh
   - Implemented in `lib/utils/cache.ts`

2. **Supabase cache** (persistent, shared)
   - Slower than client cache but persistent
   - Shared across all users
   - Survives page refreshes

**Flow**:
```
1. Check client-side cache → Return if found
2. Check Supabase cache → Return if found (also cache in client-side)
3. Call Google Maps API → Cache in both client-side and Supabase
```

### Cache Invalidation

- **Geocode cache**: Never expires (addresses don't change)
- **Destination locations**: 7 days (configurable in API route)
- **Place details**: 30 days (configurable in API route)
- **Top locations**: Manual refresh button in UI

### Error Handling

All cache operations are "best-effort":
- Cache failures don't block API calls
- Errors are logged but don't break functionality
- Falls back to direct API calls if cache fails

## Benefits

1. **Reduced API Costs**: Popular destinations (London, Paris, Tokyo) are cached and reused
2. **Faster Load Times**: Cached results return instantly
3. **Better UX**: Users see results immediately for common searches
4. **Shared Cache**: One user's search benefits all users

## Example Flow

### User searches for "London":

1. **First user**:
   - No cache found
   - Calls Google Maps API for geocoding
   - Calls Google Maps API for place searches
   - Stores results in Supabase cache
   - Displays locations

2. **Second user** (same or different session):
   - Finds cached geocode for "London" → Instant
   - Finds cached location list for "London" → Instant
   - No API calls made
   - Displays cached locations immediately

## Monitoring

Cache effectiveness can be monitored by:
- Checking Supabase database for cache hit rates
- Monitoring Google Maps API usage (should decrease over time)
- Reviewing console logs for "Cache hit" messages

## Future Enhancements

- Cache warming: Pre-populate cache for popular destinations
- Cache analytics: Track hit rates and popular searches
- Smart invalidation: Invalidate cache when place data changes
- Regional caching: Cache by region/country for better organization
