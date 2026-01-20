import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/cache'

type CreateGroupBody = {
  userId?: string
  name?: string
  destination: string
  startDate: string
  endDate: string
  maxMembers?: number
  interests?: string[]
  description?: string
  tripId?: string | null
}

export async function GET() {
  try {
    // Check cache first
    const cacheKey = supabaseCache.key('groups:list', {})
    const cached = supabaseCache.get<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const result = (data || []).map((g) => ({
      id: g.id,
      name: g.name ?? undefined,
      destination: g.destination,
      startDate: g.start_date,
      endDate: g.end_date,
      memberCount: g.member_count ?? 1,
      maxMembers: g.max_members ?? 10,
      interests: g.interests ?? [],
      description: g.description ?? undefined,
    }))

    // Cache the result
    supabaseCache.set(cacheKey, result, CACHE_TTL.GROUPS_LIST)

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error listing groups:', e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateGroupBody
    if (!body?.destination || !body?.startDate || !body?.endDate) {
      return NextResponse.json(
        { error: 'destination, startDate, endDate are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        created_by: body.userId ?? null,
        trip_id: body.tripId ?? null,
        name: body.name ?? null,
        destination: body.destination,
        start_date: body.startDate,
        end_date: body.endDate,
        max_members: body.maxMembers ?? 10,
        interests: body.interests ?? [],
        description: body.description ?? null,
        member_count: 1,
      })
      .select('*')
      .single()
    if (error) throw error

    // Optional membership row (best-effort) if userId present
    if (body.userId) {
      try {
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: body.userId,
          role: 'owner',
        })
      } catch (e) {
        console.warn('Failed to create group member row:', e)
      }
    }

    // Invalidate groups list cache since we added a new group
    supabaseCache.invalidate('groups:list')

    return NextResponse.json(
      {
        id: group.id,
        name: group.name ?? undefined,
        destination: group.destination,
        startDate: group.start_date,
        endDate: group.end_date,
        memberCount: group.member_count ?? 1,
        maxMembers: group.max_members ?? 10,
        interests: group.interests ?? [],
        description: group.description ?? undefined,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error('Error creating group:', e)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

