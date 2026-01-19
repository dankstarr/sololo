import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET - Get collaborators for an itinerary
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const itineraryId = searchParams.get('itineraryId')

  if (!itineraryId) {
    return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('itinerary_collaborators')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('joined_at', { ascending: false, nullsFirst: false })
      .order('invited_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
  }
}

// POST - Add a collaborator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itineraryId, userId, role = 'editor', invitedBy } = body

    if (!itineraryId || !userId) {
      return NextResponse.json(
        { error: 'Itinerary ID and User ID are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    
    // Check if collaborator already exists
    const { data: existing } = await supabase
      .from('itinerary_collaborators')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      )
    }

    // Add collaborator
    const { data, error } = await supabase
      .from('itinerary_collaborators')
      .insert({
        itinerary_id: itineraryId,
        user_id: userId,
        role: role || 'editor',
        invited_by: invitedBy || null,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Create edit history entry
    await supabase.from('itinerary_edit_history').insert({
      itinerary_id: itineraryId,
      user_id: invitedBy || userId,
      action_type: 'collaborator_added',
      details: {
        collaborator_user_id: userId,
        role: role || 'editor',
      },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error adding collaborator:', error)
    if (error.code === '23505') {
      // Unique constraint violation
      return NextResponse.json(
        { error: 'User is already a collaborator' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 })
  }
}

// DELETE - Remove a collaborator
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const itineraryId = searchParams.get('itineraryId')
    const userId = searchParams.get('userId')
    const removedBy = searchParams.get('removedBy')

    if (!itineraryId || !userId) {
      return NextResponse.json(
        { error: 'Itinerary ID and User ID are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    
    // Remove collaborator
    const { error } = await supabase
      .from('itinerary_collaborators')
      .delete()
      .eq('itinerary_id', itineraryId)
      .eq('user_id', userId)

    if (error) throw error

    // Create edit history entry
    if (removedBy) {
      await supabase.from('itinerary_edit_history').insert({
        itinerary_id: itineraryId,
        user_id: removedBy,
        action_type: 'collaborator_removed',
        details: {
          collaborator_user_id: userId,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
  }
}

// PATCH - Update collaborator role
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { itineraryId, userId, role, updatedBy } = body

    if (!itineraryId || !userId || !role) {
      return NextResponse.json(
        { error: 'Itinerary ID, User ID, and Role are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    
    // Update collaborator role
    const { data, error } = await supabase
      .from('itinerary_collaborators')
      .update({ role })
      .eq('itinerary_id', itineraryId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Create edit history entry
    if (updatedBy) {
      await supabase.from('itinerary_edit_history').insert({
        itinerary_id: itineraryId,
        user_id: updatedBy,
        action_type: 'collaborator_role_updated',
        details: {
          collaborator_user_id: userId,
          new_role: role,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating collaborator role:', error)
    return NextResponse.json({ error: 'Failed to update collaborator role' }, { status: 500 })
  }
}
