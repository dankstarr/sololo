import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Get authenticated user from request
 * Returns user session or null if not authenticated
 */
export async function getServerSession(): Promise<{
  user: any
  session: any
} | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  try {
    const cookieStore = cookies()
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value || null,
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set({ name: key, value, httpOnly: true, secure: true, sameSite: 'lax' })
            } catch (error) {
              // Handle cookie setting errors gracefully
            }
          },
          removeItem: (key: string) => {
            try {
              cookieStore.set({ name: key, value: '', maxAge: 0 })
            } catch (error) {
              // Handle cookie removal errors gracefully
            }
          },
        },
      },
    } as any)

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return {
      user: session.user,
      session,
    }
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(): Promise<{
  user: any
  session: any
} | NextResponse> {
  const auth = await getServerSession()

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return auth
}

/**
 * Check if user is admin
 * For now, checks if user email is in admin list
 * In production, use a proper role system (e.g., user_profiles.is_admin)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Get admin emails from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  
  if (adminEmails.length === 0) {
    // If no admin emails configured, allow all authenticated users (for development)
    // In production, this should be restricted
    return process.env.NODE_ENV === 'production' ? false : true
  }

  try {
    const auth = await getServerSession()
    if (!auth) return false

    const userEmail = auth.user.email
    return adminEmails.includes(userEmail || '')
  } catch (error) {
    return false
  }
}

/**
 * Require admin access - returns 403 if not admin
 */
export async function requireAdmin(): Promise<{
  user: any
  session: any
} | NextResponse> {
  const auth = await requireAuth()
  
  if (auth instanceof NextResponse) {
    return auth // Already an error response
  }

  const isUserAdmin = await isAdmin(auth.user.id)
  
  if (!isUserAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return auth
}

/**
 * Verify user owns resource (by userId field)
 */
export function verifyOwnership(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId
}

/**
 * Create authenticated API handler wrapper
 */
export function withAuth(
  handler: (req: NextRequest, auth: { user: any; session: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, existingAuth?: { user: any; session: any }) => {
    // If auth already provided (from secureRoute), use it
    if (existingAuth) {
      return handler(req, existingAuth)
    }
    
    const auth = await requireAuth()
    
    if (auth instanceof NextResponse) {
      return auth // Return error response
    }

    return handler(req, auth)
  }
}

/**
 * Create admin-only API handler wrapper
 */
export function withAdmin(
  handler: (req: NextRequest, auth: { user: any; session: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, existingAuth?: { user: any; session: any }) => {
    // If auth already provided (from secureRoute), verify it's admin
    if (existingAuth) {
      const isUserAdmin = await isAdmin(existingAuth.user.id)
      if (!isUserAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
      return handler(req, existingAuth)
    }
    
    const auth = await requireAdmin()
    
    if (auth instanceof NextResponse) {
      return auth // Return error response
    }

    return handler(req, auth)
  }
}
