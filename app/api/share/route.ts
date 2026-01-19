import { NextRequest, NextResponse } from 'next/server'
import { getSharedItinerary, storeSharedItinerary } from '@/lib/shared-itineraries-store'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/supabase-cache'

export const dynamic = 'force-dynamic'

// POST - Share an itinerary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trip, locations, itinerary } = body

    if (!trip || !itinerary) {
      return NextResponse.json(
        { error: 'Trip and itinerary are required' },
        { status: 400 }
      )
    }

    // If Supabase isn't configured (local/dev), fall back to in-memory store.
    let shareId: string
    const userId = body.userId || body.createdBy || null
    
    try {
      const supabase = supabaseAdmin()
      shareId = body.shareId || crypto.randomUUID()
      
      // Check if itinerary already exists (for updates)
      const { data: existing } = await supabase
        .from('shared_itineraries')
        .select('*')
        .eq('id', shareId)
        .maybeSingle()
      
      if (existing) {
        // Update existing itinerary
        const { error } = await supabase
          .from('shared_itineraries')
          .update({
            trip,
            locations: locations || [],
            itinerary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shareId)
        
        if (error) throw error
        
        // Create edit history entry if userId is provided
        if (userId && body.actionType) {
          await supabase.from('itinerary_edit_history').insert({
            itinerary_id: shareId,
            user_id: userId,
            action_type: body.actionType || 'itinerary_updated',
            details: body.details || {},
            previous_state: body.previousState || null,
          })
        }
      } else {
        // Create new itinerary
        const { error } = await supabase.from('shared_itineraries').insert({
          id: shareId,
          trip,
          locations: locations || [],
          itinerary,
          created_by: userId,
        })
        if (error) throw error
        
        // Add creator as admin collaborator if userId is provided
        if (userId) {
          await supabase.from('itinerary_collaborators').insert({
            itinerary_id: shareId,
            user_id: userId,
            role: 'admin',
            joined_at: new Date().toISOString(),
          })
        }
      }
      
      // Invalidate shared itineraries list cache since we added/updated one
      supabaseCache.invalidate('shared_itineraries:list')
    } catch (e) {
      shareId = storeSharedItinerary({ trip, locations: locations || [], itinerary })
    }

    return NextResponse.json({
      shareId,
      shareUrl: `/discover/share/${shareId}`,
    })
  } catch (error) {
    console.error('Error sharing itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to share itinerary' },
      { status: 500 }
    )
  }
}

// GET - Get a shared itinerary
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shareId = searchParams.get('id')

  if (!shareId) {
    return NextResponse.json(
      { error: 'Share ID is required' },
      { status: 400 }
    )
  }

  try {
    // Check cache first
    const cacheKey = supabaseCache.key('shared_itinerary', { id: shareId })
    const cached = supabaseCache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = supabaseAdmin()
    const { data: shared, error } = await supabase
      .from('shared_itineraries')
      .select('*')
      .eq('id', shareId)
      .maybeSingle()
    if (error) {
      console.error('Error loading shared itinerary:', error)
      return NextResponse.json({ error: 'Failed to load shared itinerary' }, { status: 500 })
    }
    if (!shared) return NextResponse.json({ error: 'Shared itinerary not found' }, { status: 404 })

    // Best-effort views increment (non-critical)
    let views = (shared.views ?? 0) + 1
    try {
      await supabase
        .from('shared_itineraries')
        .update({ views })
        .eq('id', shareId)
    } catch (e) {
      console.warn('Failed to increment views:', e)
    }

    const result = {
      id: shared.id,
      trip: shared.trip,
      locations: shared.locations,
      itinerary: shared.itinerary,
      createdAt: shared.created_at ? new Date(shared.created_at).getTime() : Date.now(),
      views,
    }

    // Cache the result (cache for 5 minutes)
    supabaseCache.set(cacheKey, result, CACHE_TTL.SHARED_ITINERARY)

    return NextResponse.json(result)
  } catch (e) {
    const shared = getSharedItinerary(shareId)
    if (!shared) return NextResponse.json({ error: 'Shared itinerary not found' }, { status: 404 })
    return NextResponse.json(shared)
  }
}
