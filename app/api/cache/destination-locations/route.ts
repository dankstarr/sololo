import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Build cache key from destination + optional filters
function buildCacheKey(destination: string, days?: number, interests?: string[]): string {
  const parts = [destination.toLowerCase().trim()]
  if (days) parts.push(`d${days}`)
  if (interests && interests.length > 0) {
    parts.push(`i${interests.sort().join(',')}`)
  }
  return parts.join(':')
}

// GET - Check cache for destination locations
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const destination = searchParams.get('destination')
  const days = searchParams.get('days') ? Number(searchParams.get('days')) : undefined
  const interests = searchParams.get('interests') ? searchParams.get('interests')!.split(',') : undefined

  if (!destination) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    let query = supabase
      .from('destination_locations_cache')
      .select('locations, created_at')
      .eq('destination', destination.toLowerCase().trim())
      .order('created_at', { ascending: false })

    // Filter by days if provided
    if (days !== undefined && days !== null) {
      query = query.eq('days', days)
    } else {
      query = query.is('days', null)
    }

    // Filter by interests if provided (match array exactly)
    if (interests && interests.length > 0) {
      const sortedInterests = [...interests].sort()
      query = query.eq('interests', sortedInterests)
    } else {
      query = query.is('interests', null)
    }

    const { data, error } = await query.limit(1).maybeSingle()

    if (error) {
      console.error('Error reading destination_locations_cache:', error)
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    if (!data) {
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    // Check if cache is fresh (less than 7 days old)
    const cacheAge = Date.now() - new Date(data.created_at).getTime()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

    if (cacheAge > maxAge) {
      return NextResponse.json({ cached: false, expired: true }, { status: 200 })
    }

    return NextResponse.json({
      cached: true,
      locations: data.locations ?? [],
    })
  } catch (e) {
    console.error('Error in GET /api/cache/destination-locations:', e)
    return NextResponse.json({ cached: false }, { status: 200 })
  }
}

// POST - Store destination locations in cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, days, interests, locations } = body

    if (!destination || !Array.isArray(locations)) {
      return NextResponse.json({ error: 'destination and locations array are required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase.from('destination_locations_cache').insert({
      destination: destination.toLowerCase().trim(),
      days: days ?? null,
      interests: interests && Array.isArray(interests) ? interests : null,
      locations,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error writing destination_locations_cache:', error)
      return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error in POST /api/cache/destination-locations:', e)
    return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
  }
}
