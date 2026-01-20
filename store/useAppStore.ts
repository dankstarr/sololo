import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Location, TripFormData, Day, Group, UserProfile } from '@/types'
import { sampleGroups } from '@/config/sample-data'
import {
  toggleSavedItemInDB,
  syncSavedItemsFromDB,
  syncUserProfileFromDB,
  updateUserProfileInDB,
} from '@/lib/utils/user'

interface AppState {
  // User & Subscription
  itineraryCount: number
  isPro: boolean
  incrementItineraryCount: () => void
  checkLimit: () => boolean
  upgradeToPro: () => void

  // User Profile
  userProfile: UserProfile
  updateUserProfile: (profile: Partial<UserProfile>) => void

  // Current Trip Data
  currentTrip: TripFormData | null
  currentTripId: string | null
  currentShareId: string | null
  selectedLocations: Location[]
  itinerary: Day[]
  currentTheme: string
  setCurrentTrip: (trip: TripFormData) => void
  setCurrentTripId: (id: string | null) => void
  setCurrentShareId: (shareId: string | null) => void
  setSelectedLocations: (locations: Location[]) => void
  setItinerary: (itinerary: Day[]) => void
  setCurrentTheme: (theme: string) => void
  clearTrip: () => void

  // Groups
  groups: Group[]
  currentGroup: Group | null
  setGroups: (groups: Group[]) => void
  setCurrentGroup: (group: Group | null) => void
  addGroup: (group: Group) => void

  // Saved Items
  savedItineraries: string[]
  savedAudioGuides: string[]
  savedRoutes: string[]
  likedItineraries: string[]
  likedAudioGuides: string[]
  likedRoutes: string[]
  toggleSavedItinerary: (id: string) => void
  toggleSavedAudioGuide: (id: string) => void
  toggleSavedRoute: (id: string) => void
  toggleLikedItinerary: (id: string) => void
  toggleLikedAudioGuide: (id: string) => void
  toggleLikedRoute: (id: string) => void
  
  // DB Sync helpers
  syncFromDB: () => Promise<void>
  setSavedItineraries: (ids: string[]) => void
  setSavedAudioGuides: (ids: string[]) => void
  setSavedRoutes: (ids: string[]) => void
  setLikedItineraries: (ids: string[]) => void
  setLikedAudioGuides: (ids: string[]) => void
  setLikedRoutes: (ids: string[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // User & Subscription
  itineraryCount: 0,
  isPro: false,
  incrementItineraryCount: () =>
    set((state) => ({ itineraryCount: state.itineraryCount + 1 })),
  checkLimit: () => {
    const state = get()
    return state.isPro || state.itineraryCount < 20
  },
  upgradeToPro: () => set({ isPro: true }),

  // User Profile (demo data – in real app this would come from auth/profile API)
  userProfile: {
    id: 'user-1',
    name: 'Sololo Traveler',
    email: 'you@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    bio: 'Loves food, culture, and discovering hidden gems around the world.',
    homeBase: 'London, UK',
    joinedAt: '2024-01-01',
    tripsCreated: 0,
    favoritesCount: 0,
  },
  updateUserProfile: (profile: Partial<UserProfile>) => {
    const state = get()
    const updated = { ...state.userProfile, ...profile }
    set({ userProfile: updated })
    // Sync to DB (best-effort, non-blocking)
    updateUserProfileInDB(state.userProfile.id, profile).catch(() => {})
  },

  // Current Trip Data
  currentTrip: null,
  currentTripId: null,
  currentShareId: null,
  selectedLocations: [],
  itinerary: [],
  currentTheme: 'default',
  setCurrentTrip: (trip: TripFormData) => set({ currentTrip: trip, currentTripId: null }),
  setCurrentTripId: (id: string | null) => set({ currentTripId: id }),
  setCurrentShareId: (shareId: string | null) => set({ currentShareId: shareId }),
  setSelectedLocations: (locations: Location[]) => set({ selectedLocations: locations }),
  setItinerary: (itinerary: Day[]) => set({ itinerary }),
  setCurrentTheme: (theme: string) => set({ currentTheme: theme }),
  clearTrip: () => set({ currentTrip: null, currentTripId: null, currentShareId: null, selectedLocations: [], itinerary: [] }),

  // Groups - Initialize with demo data immediately
  groups: (() => {
    // Initialize with demo groups on store creation
    return sampleGroups.map((group) => ({
      ...group,
      description: `Group exploring ${group.destination} with interests in ${group.interests?.join(', ') || 'various'}`,
    }))
  })(),
  currentGroup: null,
  setGroups: (groups: Group[]) => set({ groups }),
  setCurrentGroup: (group: Group | null) => set({ currentGroup: group }),
  addGroup: (group: Group) => set((state) => ({ groups: [...state.groups, group] })),

  // Saved Items
  savedItineraries: [],
  savedAudioGuides: [],
  savedRoutes: [],
  likedItineraries: [],
  likedAudioGuides: [],
  likedRoutes: [],
  toggleSavedItinerary: (id: string) => {
    const state = get()
    const isSaved = state.savedItineraries.includes(id)
    set({
      savedItineraries: isSaved
        ? state.savedItineraries.filter((i) => i !== id)
        : [...state.savedItineraries, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'itinerary', id, isSaved ? 'unsave' : 'save').catch(() => {})
  },
  toggleSavedAudioGuide: (id: string) => {
    const state = get()
    const isSaved = state.savedAudioGuides.includes(id)
    set({
      savedAudioGuides: isSaved
        ? state.savedAudioGuides.filter((i) => i !== id)
        : [...state.savedAudioGuides, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'audio_guide', id, isSaved ? 'unsave' : 'save').catch(() => {})
  },
  toggleSavedRoute: (id: string) => {
    const state = get()
    const isSaved = state.savedRoutes.includes(id)
    set({
      savedRoutes: isSaved
        ? state.savedRoutes.filter((i) => i !== id)
        : [...state.savedRoutes, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'route', id, isSaved ? 'unsave' : 'save').catch(() => {})
  },
  toggleLikedItinerary: (id: string) => {
    const state = get()
    const isLiked = state.likedItineraries.includes(id)
    set({
      likedItineraries: isLiked
        ? state.likedItineraries.filter((i) => i !== id)
        : [...state.likedItineraries, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'itinerary', id, isLiked ? 'unlike' : 'like').catch(() => {})
  },
  toggleLikedAudioGuide: (id: string) => {
    const state = get()
    const isLiked = state.likedAudioGuides.includes(id)
    set({
      likedAudioGuides: isLiked
        ? state.likedAudioGuides.filter((i) => i !== id)
        : [...state.likedAudioGuides, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'audio_guide', id, isLiked ? 'unlike' : 'like').catch(() => {})
  },
  toggleLikedRoute: (id: string) => {
    const state = get()
    const isLiked = state.likedRoutes.includes(id)
    set({
      likedRoutes: isLiked
        ? state.likedRoutes.filter((i) => i !== id)
        : [...state.likedRoutes, id],
    })
    toggleSavedItemInDB(state.userProfile.id, 'route', id, isLiked ? 'unlike' : 'like').catch(() => {})
  },
  
  // DB Sync helpers
  syncFromDB: async () => {
    const state = get()
    await Promise.all([
      syncUserProfileFromDB(state.userProfile.id, state.updateUserProfile),
      syncSavedItemsFromDB(state.userProfile.id, {
        setSavedItineraries: (ids) => set({ savedItineraries: ids }),
        setSavedAudioGuides: (ids) => set({ savedAudioGuides: ids }),
        setSavedRoutes: (ids) => set({ savedRoutes: ids }),
        setLikedItineraries: (ids) => set({ likedItineraries: ids }),
        setLikedAudioGuides: (ids) => set({ likedAudioGuides: ids }),
        setLikedRoutes: (ids) => set({ likedRoutes: ids }),
      }),
    ])
  },
  setSavedItineraries: (ids: string[]) => set({ savedItineraries: ids }),
  setSavedAudioGuides: (ids: string[]) => set({ savedAudioGuides: ids }),
  setSavedRoutes: (ids: string[]) => set({ savedRoutes: ids }),
  setLikedItineraries: (ids: string[]) => set({ likedItineraries: ids }),
  setLikedAudioGuides: (ids: string[]) => set({ likedAudioGuides: ids }),
  setLikedRoutes: (ids: string[]) => set({ likedRoutes: ids }),
}),
    {
      name: 'sololo-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist minimal data - most data now comes from DB
        // Keep userId and subscription status for offline access
        itineraryCount: state.itineraryCount,
        isPro: state.isPro,
        userProfile: { id: state.userProfile.id }, // Only persist ID
      }),
    }
  )
)
