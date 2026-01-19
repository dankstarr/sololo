import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET - Check cache for place details
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const placeId = searchParams.get('place_id')

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('place_details_cache')
      .select('details, created_at')
      .eq('place_id', placeId)
      .maybeSingle()

    if (error) {
      console.error('Error reading place_details_cache:', error)
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    if (!data) {
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    // Check if cache is fresh (less than 30 days old - place details change infrequently)
    const cacheAge = Date.now() - new Date(data.created_at).getTime()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days

    if (cacheAge > maxAge) {
      return NextResponse.json({ cached: false, expired: true }, { status: 200 })
    }

    return NextResponse.json({
      cached: true,
      details: data.details,
    })
  } catch (e) {
    console.error('Error in GET /api/cache/place-details:', e)
    return NextResponse.json({ cached: false }, { status: 200 })
  }
}

// POST - Store place details in cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { place_id, details } = body

    if (!place_id || !details) {
      return NextResponse.json({ error: 'place_id and details are required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('place_details_cache')
      .upsert(
        {
          place_id,
          details,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'place_id' }
      )

    if (error) {
      console.error('Error writing place_details_cache:', error)
      return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error in POST /api/cache/place-details:', e)
    return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
  }
}
