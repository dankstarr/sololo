import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { listSharedItineraries } from '@/lib/shared-itineraries-store'

export const dynamic = 'force-dynamic'

// GET - List all shared itineraries (for discover page)
export async function GET() {
  // If Supabase isn't configured (local/dev), fall back to in-memory store.
  let supabase: ReturnType<typeof supabaseAdmin> | null = null
  try {
    supabase = supabaseAdmin()
  } catch (e) {
    const data = listSharedItineraries(50)
    return NextResponse.json(data, { status: 200 })
  }

  const { data, error } = await supabase
    .from('shared_itineraries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error listing shared itineraries:', error)
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(
    (data || []).map((row) => ({
      id: row.id,
      trip: row.trip,
      locations: row.locations,
      itinerary: row.itinerary,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      views: row.views ?? 0,
    }))
  )
}
