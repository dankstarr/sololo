import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/supabase-cache'
import { withAdmin, withAuth, verifyOwnership } from '@/lib/auth/server'

// GET all cities with their location counts
export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const searchParams = req.nextUrl.searchParams
    const cityId = searchParams.get('cityId')

    // If cityId is provided, get locations for that city
    if (cityId) {
      console.log(`[API Server] GET /api/cities?cityId=${cityId} - Fetching city locations`)
      // Check cache first
      const cacheKey = supabaseCache.key('city_locations', { cityId })
      const cached = supabaseCache.get<any[]>(cacheKey)
      if (cached) {
        console.log(`[API Server] GET /api/cities?cityId=${cityId} - Cache hit - Returning ${cached.length} locations`)
        return NextResponse.json({ locations: cached })
      }
      console.log(`[API Server] GET /api/cities?cityId=${cityId} - Cache miss - Querying database`)

      const { data: locations, error: locError } = await supabase
        .from('city_locations')
        .select('*')
        .eq('city_id', cityId)
        .order('reviews', { ascending: false, nullsFirst: false })
        .order('rating', { ascending: false, nullsFirst: false })

      if (locError) {
        // If table doesn't exist, return empty array
        if (locError.code === 'PGRST205' || locError.message?.includes('Could not find the table')) {
          console.warn('City locations table does not exist yet. Please apply schema.sql to Supabase.')
          return NextResponse.json({ locations: [] }, { status: 200 })
        }
        console.error('Error fetching city locations:', locError)
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
      }

      const result = locations || []
      
      // Log detailed information for debugging
      console.log(`[API Server] GET /api/cities?cityId=${cityId} - Query result: ${result.length} locations`)
      if (result.length === 0) {
        // Check if city exists
        const { data: cityData } = await supabase
          .from('cities')
          .select('id, name, country')
          .eq('id', cityId)
          .maybeSingle()
        
        if (!cityData) {
          console.warn(`[API Server] City with id=${cityId} does not exist in database`)
        } else {
          console.warn(`[API Server] City "${cityData.name}" exists but has no locations saved. City ID: ${cityId}`)
        }
      } else {
        // Log sample data to verify reviews are correct
        const sample = result[0]
        console.log(`[API Server] Sample location from DB: "${sample.name}" - rating: ${sample.rating}, reviews: ${sample.reviews} (type: rating=${typeof sample.rating}, reviews=${typeof sample.reviews})`)
      }
      
      // Cache the result (even if empty)
      supabaseCache.set(cacheKey, result, CACHE_TTL.CITY_LOCATIONS)
      console.log(`[API Server] GET /api/cities?cityId=${cityId} - Success - Found ${result.length} locations, cached`)

      return NextResponse.json({ locations: result }, { status: 200 })
    }

    // Otherwise, get all cities with location counts
    console.log('[API Server] GET /api/cities - Fetching cities list')
    // Check cache first
    const cacheKey = supabaseCache.key('cities:list', {})
    const cached = supabaseCache.get<any[]>(cacheKey)
    if (cached) {
      console.log(`[API Server] GET /api/cities - Cache hit - Returning ${cached.length} cities`)
      return NextResponse.json({ cities: cached })
    }
    console.log('[API Server] GET /api/cities - Cache miss - Querying database')

    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .order('is_major', { ascending: false })
      .order('search_count', { ascending: false })
      .order('created_at', { ascending: false })

    // Deduplicate cities by name (case-insensitive) and country
    // Keep the one with highest search_count or most recent
    if (cities && cities.length > 0) {
      const cityMap = new Map<string, any>()
      
      cities.forEach((city: any) => {
        const key = `${city.name.toLowerCase().trim()}_${(city.country || '').toLowerCase().trim()}`
        const existing = cityMap.get(key)
        
        if (!existing) {
          cityMap.set(key, city)
        } else {
          // Keep the one with higher search_count, or more recent if equal
          if (city.search_count > existing.search_count || 
              (city.search_count === existing.search_count && 
               new Date(city.created_at) > new Date(existing.created_at))) {
            cityMap.set(key, city)
          }
        }
      })
      
      // Convert back to array
      const deduplicatedCities = Array.from(cityMap.values())
      console.log(`[API Server] GET /api/cities - Deduplicated from ${cities.length} to ${deduplicatedCities.length} cities`)
      
      // Re-assign for location count calculation
      cities.length = 0
      cities.push(...deduplicatedCities)
    }

    if (citiesError) {
      // If table doesn't exist, return empty array (table may not be created yet)
      if (citiesError.code === 'PGRST205' || citiesError.message?.includes('Could not find the table')) {
        console.warn('Cities table does not exist yet. Please apply schema.sql to Supabase.')
        return NextResponse.json({ cities: [] }, { status: 200 })
      }
      console.error('Error fetching cities:', citiesError)
      return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
    }

    // Get location counts for each city
    const citiesWithCounts = await Promise.all(
      (cities || []).map(async (city: any) => {
        const { count, error: countError } = await supabase
          .from('city_locations')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id)

        // If table doesn't exist, just return 0 count
        if (countError && (countError.code === 'PGRST205' || countError.message?.includes('Could not find the table'))) {
          return {
            ...city,
            locationCount: 0,
          }
        }

        return {
          ...city,
          locationCount: countError ? 0 : (count || 0),
        }
      })
    )

    // Cache the result
    supabaseCache.set(cacheKey, citiesWithCounts, CACHE_TTL.CITIES_LIST)
    console.log(`[API Server] GET /api/cities - Success - Found ${citiesWithCounts.length} cities, cached`)

    return NextResponse.json({ cities: citiesWithCounts }, { status: 200 })
  } catch (e) {
    console.error('Error in GET /api/cities:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST save a city and its locations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cityName, country, lat, lng, locations, isMajor } = body

    console.log(`[API Server] POST /api/cities - Saving city "${cityName}"${country ? `, ${country}` : ''} with ${locations?.length || 0} locations`)

    if (!cityName || !Number.isFinite(lat) || !Number.isFinite(lng) || !Array.isArray(locations) || locations.length === 0) {
      const error = !cityName || !Number.isFinite(lat) || !Number.isFinite(lng)
        ? 'cityName, lat, and lng are required'
        : 'locations array is required and must not be empty'
      console.error(`[API Server] POST /api/cities - Validation error: ${error}`)
      return NextResponse.json({ error }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    // Normalize city name for duplicate detection (trim, lowercase)
    const normalizedCityName = cityName.trim()
    const normalizedCountry = country ? country.trim() : null

    // Check if city already exists (case-insensitive match on name)
    // Query all cities with matching name (case-insensitive) to find duplicates
    const { data: potentialDuplicates } = await supabase
      .from('cities')
      .select('id, search_count, name, country')
      .ilike('name', normalizedCityName)

    // Find the best match:
    // 1. Exact name + country match
    // 2. Exact name + null country (if we're adding null country)
    // 3. Any name match (take the first one)
    let existingCity: any = null
    
    if (potentialDuplicates && potentialDuplicates.length > 0) {
      // Try exact match first
      existingCity = potentialDuplicates.find(
        (c) => c.name.toLowerCase().trim() === normalizedCityName.toLowerCase() &&
               ((normalizedCountry && c.country === normalizedCountry) ||
                (!normalizedCountry && !c.country))
      )
      
      // If no exact match, use first one (same name, different country)
      if (!existingCity) {
        existingCity = potentialDuplicates[0]
      }
    }

    let cityId: string

    if (existingCity) {
      // Update existing city (normalize name and country to prevent duplicates)
      cityId = existingCity.id
      const { error: updateError } = await supabase
        .from('cities')
        .update({
          name: normalizedCityName, // Normalize name to prevent case variations
          country: normalizedCountry, // Normalize country
          search_count: (existingCity.search_count || 0) + 1,
          updated_at: new Date().toISOString(),
          is_major: isMajor !== undefined ? isMajor : existingCity.is_major || false,
          // Update coordinates if they're significantly different (might be more accurate)
          lat: lat,
          lng: lng,
        })
        .eq('id', cityId)

      if (updateError) {
        console.error('Error updating city:', updateError)
        return NextResponse.json({ error: 'Failed to update city' }, { status: 500 })
      }

      // Delete existing locations and insert new ones
      const { error: deleteError } = await supabase
        .from('city_locations')
        .delete()
        .eq('city_id', cityId)

      if (deleteError) {
        console.error('Error deleting old locations:', deleteError)
        // Continue anyway - we'll insert new ones
      }
    } else {
      // Create new city (use normalized values)
      const { data: newCity, error: insertError } = await supabase
        .from('cities')
        .insert({
          name: normalizedCityName,
          country: normalizedCountry,
          lat,
          lng,
          is_major: isMajor !== undefined ? isMajor : false,
          search_count: 1,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating city:', insertError)
        return NextResponse.json({ error: 'Failed to create city' }, { status: 500 })
      }

      cityId = newCity.id
    }

    // Insert locations
    const locationRows = locations.map((loc: any, idx: number) => {
      // Ensure proper numeric conversion - only convert if value exists and is valid
      // Don't default to 0 - use null/undefined so we know data is missing
      const rating = loc.rating != null && loc.rating !== '' && !isNaN(Number(loc.rating)) && Number(loc.rating) > 0 
        ? Number(loc.rating) 
        : null
      const reviews = loc.reviews != null && loc.reviews !== '' && !isNaN(Number(loc.reviews)) && Number(loc.reviews) > 0
        ? Number(loc.reviews)
        : null
      
      // Log sample to verify data (only log first one)
      if (idx === 0) {
        console.log(`[API Server] Sample location being saved: "${loc.name}" - rating: ${rating} (raw: ${loc.rating}), reviews: ${reviews} (raw: ${loc.reviews}), place_id: ${loc.placeId || 'missing'}`)
      }
      
      return {
        city_id: cityId,
        name: loc.name || '',
        category: loc.category || 'Attraction',
        description: loc.description || null,
        rating: rating,
        reviews: reviews,
        lat: loc.lat ? Number(loc.lat) : null,
        lng: loc.lng ? Number(loc.lng) : null,
        distance: loc.distance || null,
        image: loc.image || null,
        place_id: loc.placeId || null, // Save place_id for enrichment
      }
    })

    const { error: locError } = await supabase
      .from('city_locations')
      .insert(locationRows)

    if (locError) {
      console.error('Error inserting locations:', locError)
      return NextResponse.json({ error: 'Failed to save locations' }, { status: 500 })
    }

    // Invalidate caches since we updated cities/locations
    supabaseCache.invalidate('cities:list')
    supabaseCache.invalidate('city_locations')
    console.log(`[API Server] POST /api/cities - Success - Saved city "${cityName}" (${existingCity ? 'updated' : 'created'}) with ${locations.length} locations, caches invalidated`)

    return NextResponse.json(
      { 
        success: true, 
        cityId,
        locationCount: locations.length 
      },
      { status: 200 }
    )
  } catch (e) {
    console.error('Error in POST /api/cities:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a location or city (admin only)
async function handleDelete(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const locationId = searchParams.get('locationId')
    const cityId = searchParams.get('cityId')

    if (!locationId && !cityId) {
      return NextResponse.json({ error: 'locationId or cityId is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    // Delete a specific location
    if (locationId) {
      console.log(`[API Server] DELETE /api/cities?locationId=${locationId} - Deleting location`)
      
      const { error } = await supabase
        .from('city_locations')
        .delete()
        .eq('id', locationId)

      if (error) {
        console.error('Error deleting location:', error)
        return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
      }

      // Invalidate caches
      supabaseCache.invalidate('city_locations')
      supabaseCache.invalidate('cities:list')
      
      console.log(`[API Server] DELETE /api/cities?locationId=${locationId} - Success`)
      return NextResponse.json({ success: true, message: 'Location deleted' }, { status: 200 })
    }

    // Delete an entire city and all its locations
    if (cityId) {
      console.log(`[API Server] DELETE /api/cities?cityId=${cityId} - Deleting city and all locations`)
      
      // Delete locations first (cascade should handle this, but being explicit)
      const { error: locError } = await supabase
        .from('city_locations')
        .delete()
        .eq('city_id', cityId)

      if (locError) {
        console.error('Error deleting city locations:', locError)
        // Continue anyway - try to delete city
      }

      // Delete the city
      const { error: cityError } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId)

      if (cityError) {
        console.error('Error deleting city:', cityError)
        return NextResponse.json({ error: 'Failed to delete city' }, { status: 500 })
      }

      // Invalidate caches
      supabaseCache.invalidate('city_locations')
      supabaseCache.invalidate('cities:list')
      
      console.log(`[API Server] DELETE /api/cities?cityId=${cityId} - Success`)
      return NextResponse.json({ success: true, message: 'City and all locations deleted' }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (e) {
    console.error('Error in DELETE /api/cities:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export routes with appropriate protection
// GET and POST are public (for reading/searching cities)
// DELETE requires admin access
export const DELETE = withAdmin(handleDelete)
