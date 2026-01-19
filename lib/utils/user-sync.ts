// Utility functions to sync user data between Zustand store and Supabase

import type { UserProfile } from '@/types'

const DEFAULT_USER_ID = 'user-1'

// Sync user profile from DB to store
export async function syncUserProfileFromDB(
  userId: string = DEFAULT_USER_ID,
  updateUserProfile: (profile: Partial<UserProfile>) => void
): Promise<void> {
  try {
    const res = await fetch(`/api/users/profile?userId=${userId}`)
    if (!res.ok) return

    const data = await res.json()
    updateUserProfile({
      id: data.id,
      name: data.name,
      email: data.email || '',
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      homeBase: data.home_base || undefined,
      joinedAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
      tripsCreated: data.trips_created || 0,
      favoritesCount: data.favorites_count || 0,
    })
  } catch (e) {
    console.warn('Failed to sync user profile from DB:', e)
  }
}

// Sync saved items from DB to store
export async function syncSavedItemsFromDB(
  userId: string = DEFAULT_USER_ID,
  callbacks: {
    setSavedItineraries: (ids: string[]) => void
    setSavedAudioGuides: (ids: string[]) => void
    setSavedRoutes: (ids: string[]) => void
    setLikedItineraries: (ids: string[]) => void
    setLikedAudioGuides: (ids: string[]) => void
    setLikedRoutes: (ids: string[]) => void
  }
): Promise<void> {
  try {
    const res = await fetch(`/api/users/saved-items?userId=${userId}`)
    if (!res.ok) return

    const data = await res.json()
    callbacks.setSavedItineraries(data.savedItineraries || [])
    callbacks.setSavedAudioGuides(data.savedAudioGuides || [])
    callbacks.setSavedRoutes(data.savedRoutes || [])
    callbacks.setLikedItineraries(data.likedItineraries || [])
    callbacks.setLikedAudioGuides(data.likedAudioGuides || [])
    callbacks.setLikedRoutes(data.likedRoutes || [])
  } catch (e) {
    console.warn('Failed to sync saved items from DB:', e)
  }
}

// Save item to DB (toggle save/like)
export async function toggleSavedItemInDB(
  userId: string,
  itemType: 'itinerary' | 'audio_guide' | 'route' | 'location',
  itemId: string,
  action: 'save' | 'unsave' | 'like' | 'unlike'
): Promise<boolean> {
  try {
    const res = await fetch('/api/users/saved-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemType, itemId, action }),
    })
    return res.ok
  } catch (e) {
    console.warn('Failed to toggle saved item in DB:', e)
    return false
  }
}

// Save location to DB
export async function saveLocationToDB(
  userId: string,
  locationId: string,
  locationData: any
): Promise<boolean> {
  try {
    const res = await fetch('/api/users/saved-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, locationId, locationData }),
    })
    return res.ok
  } catch (e) {
    console.warn('Failed to save location to DB:', e)
    return false
  }
}

// Remove saved location from DB
export async function removeSavedLocationFromDB(
  userId: string,
  locationId: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/saved-locations?userId=${userId}&locationId=${locationId}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch (e) {
    console.warn('Failed to remove saved location from DB:', e)
    return false
  }
}

// Sync saved locations from DB
export async function syncSavedLocationsFromDB(
  userId: string = DEFAULT_USER_ID
): Promise<any[]> {
  try {
    const res = await fetch(`/api/users/saved-locations?userId=${userId}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.locations || []
  } catch (e) {
    console.warn('Failed to sync saved locations from DB:', e)
    return []
  }
}

// Sync user trips from DB
export async function syncUserTripsFromDB(
  userId: string = DEFAULT_USER_ID
): Promise<any[]> {
  try {
    const res = await fetch(`/api/users/trips?userId=${userId}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.trips || []
  } catch (e) {
    console.warn('Failed to sync user trips from DB:', e)
    return []
  }
}

// Update user profile in DB
export async function updateUserProfileInDB(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name: updates.name,
        email: updates.email,
        avatar_url: updates.avatarUrl,
        bio: updates.bio,
        home_base: updates.homeBase,
        trips_created: updates.tripsCreated,
        favorites_count: updates.favoritesCount,
      }),
    })
    return res.ok
  } catch (e) {
    console.warn('Failed to update user profile in DB:', e)
    return false
  }
}
