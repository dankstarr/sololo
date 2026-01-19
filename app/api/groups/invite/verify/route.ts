import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('group_invitations')
      .select('*, groups(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      // Mark as expired
      await supabase
        .from('group_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if group still exists and has space
    const group = invitation.groups
    if (!group) {
      return NextResponse.json(
        { error: 'Group no longer exists' },
        { status: 404 }
      )
    }

    if (group.member_count >= group.max_members) {
      return NextResponse.json(
        { error: 'Group is now full' },
        { status: 400 }
      )
    }

    // Return invitation details for verification page
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        groupId: invitation.group_id,
        groupName: group.name || group.destination,
        destination: group.destination,
        expiresAt: invitation.expires_at,
      },
    })
  } catch (error) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('group_invitations')
      .select('*, groups(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      await supabase
        .from('group_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    const group = invitation.groups
    if (!group) {
      return NextResponse.json(
        { error: 'Group no longer exists' },
        { status: 404 }
      )
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', invitation.email)
      .single()

    if (existingMember) {
      // Mark invitation as accepted even if already a member
      await supabase
        .from('group_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this group',
        groupId: invitation.group_id,
      })
    }

    // Check if group has space
    if (group.member_count >= group.max_members) {
      return NextResponse.json(
        { error: 'Group is now full' },
        { status: 400 }
      )
    }

    // Add user to group members (using email as user_id)
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: invitation.email,
        role: 'member',
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json(
        { error: 'Failed to add member to group' },
        { status: 500 }
      )
    }

    // Update group member count
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        member_count: group.member_count + 1,
      })
      .eq('id', invitation.group_id)

    if (updateError) {
      console.warn('Failed to update member count:', updateError)
      // Don't fail - member was added successfully
    }

    // Mark invitation as accepted
    await supabase
      .from('group_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the group!',
      groupId: invitation.group_id,
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
