import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST - Track analytics event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, eventType, eventData } = body

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId || null,
      event_type: eventType,
      event_data: eventData || {},
    })

    if (error) {
      console.error('Error tracking analytics event:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in POST /api/analytics:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get analytics (admin only, with filters)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const eventType = searchParams.get('eventType')
    const userId = searchParams.get('userId')
    const limit = Number(searchParams.get('limit')) || 100

    const supabase = supabaseAdmin()
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json({ events: data || [] })
  } catch (e) {
    console.error('Error in GET /api/analytics:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
