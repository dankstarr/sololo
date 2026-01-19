import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseCache, CACHE_TTL } from '@/lib/utils/supabase-cache'
import { withAuth, verifyOwnership } from '@/lib/auth/server'
import { secureRoute, validateRequestBody, validators } from '@/lib/security/middleware'

// GET - Get user profile
async function handleGet(req: NextRequest, auth: { user: any; session: any }) {
  const searchParams = req.nextUrl.searchParams
  const requestedUserId = searchParams.get('userId')
  
  // Require authentication
  const currentUserId = auth.user.id
  
  // Users can only view their own profile (unless admin)
  const userId = requestedUserId || currentUserId
  
  // Verify ownership (users can only access their own data)
  if (userId !== currentUserId) {
    // Check if user is admin (for admin viewing other profiles)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(auth.user.email || '')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You can only access your own profile' },
        { status: 403 }
      )
    }
  }

  try {
    // Check cache first
    const cacheKey = supabaseCache.key('user_profile', { userId })
    const cached = supabaseCache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If profile doesn't exist, create default one
    if (!data) {
      const defaultProfile = {
        id: userId,
        name: 'Sololo Traveler',
        email: null,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        bio: 'Loves food, culture, and discovering hidden gems around the world.',
        home_base: 'London, UK',
        is_pro: false,
        itinerary_count: 0,
        trips_created: 0,
        favorites_count: 0,
      }

      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        return NextResponse.json(defaultProfile, { status: 200 })
      }

      supabaseCache.set(cacheKey, newProfile, CACHE_TTL.CITIES_LIST) // 10 min cache
      return NextResponse.json(newProfile)
    }

    // Cache the result
    supabaseCache.set(cacheKey, data, CACHE_TTL.CITIES_LIST)

    return NextResponse.json(data)
  } catch (e) {
    console.error('Error in GET /api/users/profile:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT - Update user profile
async function handlePost(req: NextRequest, auth: { user: any; session: any }) {
  try {
    const body = await req.json()
    const requestedUserId = body.userId || auth.user.id
    const { userId, ...updates } = body

    // Users can only update their own profile
    if (requestedUserId !== auth.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own profile' },
        { status: 403 }
      )
    }

    // Validate and sanitize input
    const validation = validateRequestBody(updates, {
      name: validators.string(0, 100),
      email: validators.email(),
      bio: validators.string(0, 500),
      home_base: validators.string(0, 100),
    })

    if (!validation.valid && Object.keys(validation.errors).length > 0) {
      return NextResponse.json(
        { error: 'Invalid input', errors: validation.errors },
        { status: 400 }
      )
    }

    const userIdToUpdate = requestedUserId
    const sanitizedUpdates = validation.sanitized

    const supabase = supabaseAdmin()
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
        .eq('id', userIdToUpdate)
        .maybeSingle()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userIdToUpdate)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userIdToUpdate,
          name: sanitizedUpdates?.name || updates?.name || 'Sololo Traveler',
          email: sanitizedUpdates?.email || updates?.email || null,
          avatar_url: sanitizedUpdates?.avatar_url || updates?.avatar_url || null,
          bio: sanitizedUpdates?.bio || updates?.bio || null,
          home_base: sanitizedUpdates?.home_base || updates?.home_base || null,
          is_pro: sanitizedUpdates?.is_pro || updates?.is_pro || false,
          itinerary_count: sanitizedUpdates?.itinerary_count || updates?.itinerary_count || 0,
          trips_created: sanitizedUpdates?.trips_created || updates?.trips_created || 0,
          favorites_count: sanitizedUpdates?.favorites_count || updates?.favorites_count || 0,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // Invalidate cache
    supabaseCache.invalidate('user_profile')

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error in POST /api/users/profile:', e)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// DELETE - Delete user account and all associated data
async function handleDelete(req: NextRequest, auth: { user: any; session: any }) {
  try {
    const searchParams = req.nextUrl.searchParams
    const requestedUserId = searchParams.get('userId') || auth.user.id

    // Users can only delete their own account
    if (requestedUserId !== auth.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own account' },
        { status: 403 }
      )
    }

    const userId = requestedUserId

    const supabase = supabaseAdmin()

    // Delete all user data (cascade will handle related tables)
    // Note: This will delete trips, saved items, locations, etc. due to CASCADE
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error

    // Invalidate cache
    supabaseCache.invalidate('user_profile')

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('Error in DELETE /api/users/profile:', e)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

// Helper to combine auth and security
function withAuthAndSecurity(
  handler: (req: NextRequest, auth: { user: any; session: any }) => Promise<NextResponse>,
  securityOptions: { rateLimit?: any; maxRequestSize?: number } = {}
) {
  const authHandler = withAuth(handler)
  return secureRoute(authHandler, securityOptions)
}

// Export with authentication and security protection
export const GET = withAuthAndSecurity(handleGet, {
  rateLimit: { maxRequests: 60, windowMs: 60 * 1000 },
})
export const POST = withAuthAndSecurity(handlePost, {
  rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  maxRequestSize: 10 * 1024, // 10KB max
})
export const DELETE = withAuthAndSecurity(handleDelete, {
  rateLimit: { maxRequests: 5, windowMs: 60 * 1000 },
})
