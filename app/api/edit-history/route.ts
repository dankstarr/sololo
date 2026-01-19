import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET - Get edit history for an itinerary
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const itineraryId = searchParams.get('itineraryId')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!itineraryId) {
    return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('itinerary_edit_history')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching edit history:', error)
    return NextResponse.json({ error: 'Failed to fetch edit history' }, { status: 500 })
  }
}

// POST - Create an edit history entry (called automatically when itinerary is updated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itineraryId, userId, actionType, details, previousState } = body

    if (!itineraryId || !userId || !actionType) {
      return NextResponse.json(
        { error: 'Itinerary ID, User ID, and Action Type are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    
    const { data, error } = await supabase
      .from('itinerary_edit_history')
      .insert({
        itinerary_id: itineraryId,
        user_id: userId,
        action_type: actionType,
        details: details || {},
        previous_state: previousState || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating edit history entry:', error)
    return NextResponse.json({ error: 'Failed to create edit history entry' }, { status: 500 })
  }
}
