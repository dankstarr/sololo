import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/cache'

// GET - Get user trips
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId') || 'user-1'

  try {
    // Check cache first
    const cacheKey = supabaseCache.key('user_trips', { userId })
    const cached = supabaseCache.get<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ trips: cached })
    }

    const supabase = supabaseAdmin()
    
    // Get trips with their itineraries
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (tripsError) {
      console.error('Error fetching user trips:', tripsError)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    // Get itineraries for each trip
    const tripsWithItineraries = await Promise.all(
      (trips || []).map(async (trip) => {
        const { data: itinerary } = await supabase
          .from('trip_itineraries')
          .select('days')
          .eq('trip_id', trip.id)
          .maybeSingle()

        const { data: locations } = await supabase
          .from('trip_locations')
          .select('location')
          .eq('trip_id', trip.id)
          .order('position', { ascending: true })

        return {
          id: trip.id,
          destination: trip.destination,
          days: trip.days,
          startDate: trip.start_date,
          endDate: trip.end_date,
          interests: trip.interests || [],
          travelMode: trip.travel_mode,
          pace: trip.pace,
          accessibility: trip.accessibility,
          createdAt: trip.created_at,
          itinerary: itinerary?.days || [],
          locations: (locations || []).map((l) => l.location),
        }
      })
    )

    // Cache the result
    supabaseCache.set(cacheKey, tripsWithItineraries, CACHE_TTL.SHARED_ITINERARY) // 5 min cache

    return NextResponse.json({ trips: tripsWithItineraries })
  } catch (e) {
    console.error('Error in GET /api/users/trips:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
