'use client'

import { supabase } from '@/lib/supabase/client'

/**
 * Check if current user is admin (client-side)
 * Uses environment variable or checks user metadata
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return false
    }

    // Check admin emails from environment (client-side check is less secure)
    // Server-side check is always required for actual API access
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
    
    if (adminEmails.length === 0) {
      // Development mode: allow all authenticated users
      return process.env.NODE_ENV === 'production' ? false : !!session.user
    }

    return adminEmails.includes(session.user.email || '')
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Require authentication for client components
 * Redirects to login if not authenticated
 */
export async function requireClientAuth(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}
