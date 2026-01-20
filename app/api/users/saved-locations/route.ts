import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/cache'

// GET - Get saved locations for a user
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId') || 'user-1'

  try {
    // Check cache first
    const cacheKey = supabaseCache.key('user_saved_locations', { userId })
    const cached = supabaseCache.get<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ locations: cached })
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('user_saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved locations:', error)
      return NextResponse.json({ error: 'Failed to fetch saved locations' }, { status: 500 })
    }

    const locations = (data || []).map((item: any) => ({
      id: item.location_id,
      ...item.location_data,
    }))

    // Cache the result
    supabaseCache.set(cacheKey, locations, CACHE_TTL.SHARED_ITINERARY) // 5 min cache

    return NextResponse.json({ locations })
  } catch (e) {
    console.error('Error in GET /api/users/saved-locations:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save a location
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId = 'user-1', locationId, locationData } = body

    if (!locationId || !locationData) {
      return NextResponse.json(
        { error: 'locationId and locationData are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Check if already saved
    const { data: existing } = await supabase
      .from('user_saved_locations')
      .select('id')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ message: 'Location already saved' }, { status: 200 })
    }

    // Insert new saved location
    const { data, error } = await supabase
      .from('user_saved_locations')
      .insert({
        user_id: userId,
        location_id: locationId,
        location_data: locationData,
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    supabaseCache.invalidate('user_saved_locations')

    return NextResponse.json(data)
  } catch (e) {
    console.error('Error in POST /api/users/saved-locations:', e)
    return NextResponse.json({ error: 'Failed to save location' }, { status: 500 })
  }
}

// DELETE - Remove a saved location
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'user-1'
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('user_saved_locations')
      .delete()
      .eq('user_id', userId)
      .eq('location_id', locationId)

    if (error) throw error

    // Invalidate cache
    supabaseCache.invalidate('user_saved_locations')

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in DELETE /api/users/saved-locations:', e)
    return NextResponse.json({ error: 'Failed to remove saved location' }, { status: 500 })
  }
}
