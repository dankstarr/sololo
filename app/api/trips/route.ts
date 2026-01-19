import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Day, Location, TripFormData } from '@/types'

type CreateTripBody = {
  userId?: string
  trip: TripFormData
  locations: Location[]
  itinerary: Day[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateTripBody
    const { userId, trip, locations, itinerary } = body || ({} as CreateTripBody)

    if (!trip || !trip.destination || !trip.days) {
      return NextResponse.json({ error: 'trip.destination and trip.days are required' }, { status: 400 })
    }

    const days = Number(trip.days)
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: 'trip.days must be a positive number' }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    const { data: tripRow, error: tripErr } = await supabase
      .from('trips')
      .insert({
        user_id: userId ?? null,
        destination: trip.destination,
        days,
        start_date: trip.dates?.start || null,
        end_date: trip.dates?.end || null,
        interests: trip.interests || [],
        travel_mode: trip.travelMode,
        pace: trip.pace,
        accessibility: !!trip.accessibility,
      })
      .select('id')
      .single()

    if (tripErr) throw tripErr

    const tripId = tripRow.id as string

    if (Array.isArray(locations) && locations.length > 0) {
      const rows = locations.map((loc, idx) => ({
        trip_id: tripId,
        position: idx,
        location: loc,
      }))
      const { error: locErr } = await supabase.from('trip_locations').insert(rows)
      if (locErr) throw locErr
    }

    if (Array.isArray(itinerary) && itinerary.length > 0) {
      const { error: itinErr } = await supabase.from('trip_itineraries').insert({
        trip_id: tripId,
        days: itinerary,
      })
      if (itinErr) throw itinErr
    }

    return NextResponse.json({ id: tripId }, { status: 200 })
  } catch (e) {
    console.error('Error creating trip:', e)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

