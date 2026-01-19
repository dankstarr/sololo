import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cache key builder should mirror the logic used on the client
function buildAroundKey(lat: number, lng: number, radiusKm: number) {
  const latR = Math.round(lat * 100) / 100 // ~1km precision
  const lngR = Math.round(lng * 100) / 100
  const rR = Math.round(radiusKm * 10) / 10
  return `around:${latR},${lngR}:r=${rR}`
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('mode') || 'around'

  if (mode === 'around') {
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const radius = Number(searchParams.get('radius'))

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
      console.error('[API Server] GET /api/top-locations - Validation error: lat, lng, radius are required')
      return NextResponse.json({ error: 'lat, lng, radius are required' }, { status: 400 })
    }

    const key = buildAroundKey(lat, lng, radius)
    console.log(`[API Server] GET /api/top-locations?mode=around&lat=${lat}&lng=${lng}&radius=${radius} - Checking cache (key: ${key})`)
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('top_location_results')
      .select('locations')
      .eq('cache_key', key)
      .eq('mode', 'around')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[API Server] GET /api/top-locations - Database error:', error)
      return NextResponse.json({ error: 'Failed to read cache' }, { status: 500 })
    }

    if (!data) {
      console.log(`[API Server] GET /api/top-locations - Cache miss (key: ${key})`)
      return NextResponse.json({ locations: [] }, { status: 200 })
    }

    const locations = data.locations ?? []
    console.log(`[API Server] GET /api/top-locations - Cache hit (key: ${key}) - Returning ${Array.isArray(locations) ? locations.length : 0} locations`)
    return NextResponse.json({ locations }, { status: 200 })
  }

  return NextResponse.json({ locations: [] }, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mode = (body?.mode as string) || 'around'

    if (mode === 'around') {
      const lat = Number(body?.lat)
      const lng = Number(body?.lng)
      const radius = Number(body?.radius)
      const locations = Array.isArray(body?.locations) ? body.locations : []

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
        console.error('[API Server] POST /api/top-locations - Validation error: lat, lng, radius are required')
        return NextResponse.json({ error: 'lat, lng, radius are required' }, { status: 400 })
      }

      if (locations.length === 0) {
        console.log('[API Server] POST /api/top-locations - No locations to cache, skipping')
        return NextResponse.json({ ok: true }, { status: 200 })
      }

      const cacheKey = buildAroundKey(lat, lng, radius)
      console.log(`[API Server] POST /api/top-locations - Caching ${locations.length} locations (key: ${cacheKey}, lat: ${lat}, lng: ${lng}, radius: ${radius}km)`)
      const supabase = supabaseAdmin()

      const { error } = await supabase.from('top_location_results').insert({
        cache_key: cacheKey,
        mode: 'around',
        params: { lat, lng, radius },
        locations,
      })

      if (error) {
        console.error('[API Server] POST /api/top-locations - Database error:', error)
        return NextResponse.json({ error: 'Failed to write cache' }, { status: 500 })
      }

      console.log(`[API Server] POST /api/top-locations - Success - Cached ${locations.length} locations (key: ${cacheKey})`)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('[API Server] POST /api/top-locations - Error:', e)
    return NextResponse.json({ error: 'Failed to write cache' }, { status: 500 })
  }
}

