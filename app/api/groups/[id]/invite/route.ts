import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, generateInvitationEmailHtml } from '@/lib/utils/email'
import { randomBytes } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const groupId = id
    const body = await req.json()
    const { email, invitedBy } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if group is full
    if (group.member_count >= group.max_members) {
      return NextResponse.json(
        { error: 'Group is full' },
        { status: 400 }
      )
    }

    // Check if email is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', email) // Using email as user_id for invited members
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the group' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabase
      .from('group_invitations')
      .select('id')
      .eq('group_id', groupId)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        email,
        invited_by: invitedBy || null,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/app/groups/invite/verify?token=${token}`
    
    const inviterName = invitedBy || 'Someone'
    const groupName = group.name || group.destination
    
    const emailHtml = generateInvitationEmailHtml(
      inviterName,
      groupName,
      group.destination,
      verificationUrl
    )

    const emailSent = await sendEmail({
      to: email,
      subject: `You're invited to join ${groupName} on Sololo`,
      html: emailHtml,
      text: `${inviterName} has invited you to join a travel group: ${groupName} (${group.destination}). Click here to accept: ${verificationUrl}`,
    })

    if (!emailSent) {
      console.warn('Email sending failed, but invitation was created')
      // Don't fail the request - invitation is still created
    }

    return NextResponse.json(
      {
        success: true,
        invitationId: invitation.id,
        emailSent,
        message: emailSent
          ? 'Invitation sent successfully'
          : 'Invitation created, but email sending failed',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
