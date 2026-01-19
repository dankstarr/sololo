import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from './useAuth'

/**
 * Hook to sync user data from Supabase on component mount
 * Call this in your root layout or main app component
 * Now integrates with authentication to use the authenticated user ID
 */
export function useUserSync() {
  const { user, isAuthenticated } = useAuth()
  const syncFromDB = useAppStore((state) => state.syncFromDB)
  const updateUserProfile = useAppStore((state) => state.updateUserProfile)

  useEffect(() => {
    if (isAuthenticated && user) {
      // Update store with authenticated user info
      updateUserProfile({
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
      })
    }

    // Sync user data from DB on mount
    syncFromDB().catch(() => {
      // Silently fail - app works offline with localStorage fallback
    })
  }, [syncFromDB, updateUserProfile, isAuthenticated, user])
}
