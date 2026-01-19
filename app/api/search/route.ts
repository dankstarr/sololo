import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST - Search trips using full-text search
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, userId, limit = 20 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    // Use full-text search if search_vector column exists
    // Otherwise fall back to simple LIKE search
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .or(`destination.ilike.%${query}%,interests.cs.{${query}}`)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching trips:', error)
      return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
    }

    // Track search analytics
    try {
      await supabase.from('search_analytics').insert({
        search_query: query,
        search_type: 'destination',
        result_count: data?.length || 0,
        user_id: userId || null,
      })
    } catch (e) {
      // Best-effort analytics, don't fail the request
      console.warn('Failed to track search analytics:', e)
    }

    return NextResponse.json({ trips: data || [] })
  } catch (e) {
    console.error('Error in POST /api/search:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get popular searches
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = Number(searchParams.get('limit')) || 10

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('search_analytics')
      .select('search_query, count(*)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching popular searches:', error)
      return NextResponse.json({ error: 'Failed to fetch searches' }, { status: 500 })
    }

    return NextResponse.json({ searches: data || [] })
  } catch (e) {
    console.error('Error in GET /api/search:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
