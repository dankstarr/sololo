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
      return NextResponse.json({ error: 'lat, lng, radius are required' }, { status: 400 })
    }

    const key = buildAroundKey(lat, lng, radius)
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
      console.error('Error reading top_location_results:', error)
      return NextResponse.json({ error: 'Failed to read cache' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ locations: [] }, { status: 200 })
    }

    return NextResponse.json({ locations: data.locations ?? [] }, { status: 200 })
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
        return NextResponse.json({ error: 'lat, lng, radius are required' }, { status: 400 })
      }

      if (locations.length === 0) {
        return NextResponse.json({ ok: true }, { status: 200 })
      }

      const cacheKey = buildAroundKey(lat, lng, radius)
      const supabase = supabaseAdmin()

      const { error } = await supabase.from('top_location_results').insert({
        cache_key: cacheKey,
        mode: 'around',
        params: { lat, lng, radius },
        locations,
      })

      if (error) {
        console.error('Error writing top_location_results:', error)
        return NextResponse.json({ error: 'Failed to write cache' }, { status: 500 })
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('Error in POST /api/top-locations:', e)
    return NextResponse.json({ error: 'Failed to write cache' }, { status: 500 })
  }
}

