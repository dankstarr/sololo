import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET - Check cache for geocode result
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('geocode_cache')
      .select('lat, lng, formatted_address')
      .eq('address', address.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      console.error('Error reading geocode_cache:', error)
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    if (!data) {
      return NextResponse.json({ cached: false }, { status: 200 })
    }

    return NextResponse.json({
      cached: true,
      lat: Number(data.lat),
      lng: Number(data.lng),
      address: data.formatted_address,
    })
  } catch (e) {
    console.error('Error in GET /api/cache/geocode:', e)
    return NextResponse.json({ cached: false }, { status: 200 })
  }
}

// POST - Store geocode result in cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, lat, lng, formatted_address } = body

    if (!address || typeof lat !== 'number' || typeof lng !== 'number' || !formatted_address) {
      return NextResponse.json({ error: 'address, lat, lng, formatted_address are required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('geocode_cache')
      .upsert(
        {
          address: address.toLowerCase().trim(),
          lat,
          lng,
          formatted_address,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'address' }
      )

    if (error) {
      console.error('Error writing geocode_cache:', error)
      return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error in POST /api/cache/geocode:', e)
    return NextResponse.json({ error: 'Failed to cache' }, { status: 500 })
  }
}
