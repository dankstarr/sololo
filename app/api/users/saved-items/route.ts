import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/cache'

// GET - Get all saved items for a user
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId') || 'user-1'
  const itemType = searchParams.get('type') // Optional filter by type

  try {
    // Check cache first
    const cacheKey = supabaseCache.key('user_saved_items', { userId, itemType })
    const cached = supabaseCache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = supabaseAdmin()
    let query = supabase
      .from('user_saved_items')
      .select('*')
      .eq('user_id', userId)

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching saved items:', error)
      return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
    }

    // Group by type and action
    const result = {
      savedItineraries: [] as string[],
      savedAudioGuides: [] as string[],
      savedRoutes: [] as string[],
      savedLocations: [] as string[],
      likedItineraries: [] as string[],
      likedAudioGuides: [] as string[],
      likedRoutes: [] as string[],
    }

    ;(data || []).forEach((item: any) => {
      let key: keyof typeof result | null = null
      
      if (item.is_saved) {
        if (item.item_type === 'itinerary') key = 'savedItineraries'
        else if (item.item_type === 'audio_guide') key = 'savedAudioGuides'
        else if (item.item_type === 'route') key = 'savedRoutes'
        else if (item.item_type === 'location') key = 'savedLocations'
      } else if (item.is_liked) {
        if (item.item_type === 'itinerary') key = 'likedItineraries'
        else if (item.item_type === 'audio_guide') key = 'likedAudioGuides'
        else if (item.item_type === 'route') key = 'likedRoutes'
      }
      
      if (key && Array.isArray(result[key])) {
        ;(result[key] as string[]).push(item.item_id)
      }
    })

    // Cache the result
    supabaseCache.set(cacheKey, result, CACHE_TTL.SHARED_ITINERARY) // 5 min cache

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error in GET /api/users/saved-items:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Toggle saved/liked status
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId = 'user-1', itemType, itemId, action } = body // action: 'save', 'unsave', 'like', 'unlike'

    if (!itemType || !itemId || !action) {
      return NextResponse.json(
        { error: 'itemType, itemId, and action are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Check if item exists
    const { data: existing } = await supabase
      .from('user_saved_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle()

    let result
    if (existing) {
      // Update existing
      const updates: any = { updated_at: new Date().toISOString() }
      
      if (action === 'save') {
        updates.is_saved = true
      } else if (action === 'unsave') {
        updates.is_saved = false
      } else if (action === 'like') {
        updates.is_liked = true
      } else if (action === 'unlike') {
        updates.is_liked = false
      }

      const { data, error } = await supabase
        .from('user_saved_items')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('user_saved_items')
        .insert({
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          is_saved: action === 'save',
          is_liked: action === 'like',
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // Invalidate cache
    supabaseCache.invalidate('user_saved_items')

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error in POST /api/users/saved-items:', e)
    return NextResponse.json({ error: 'Failed to update saved item' }, { status: 500 })
  }
}
