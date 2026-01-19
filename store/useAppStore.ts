import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Location, TripFormData, Day, Group, UserProfile } from '@/types'
import { sampleGroups } from '@/config/sample-data'

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
  selectedLocations: Location[]
  itinerary: Day[]
  setCurrentTrip: (trip: TripFormData) => void
  setCurrentTripId: (id: string | null) => void
  setSelectedLocations: (locations: Location[]) => void
  setItinerary: (itinerary: Day[]) => void
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
  updateUserProfile: (profile: Partial<UserProfile>) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  // Current Trip Data
  currentTrip: null,
  currentTripId: null,
  selectedLocations: [],
  itinerary: [],
  setCurrentTrip: (trip: TripFormData) => set({ currentTrip: trip, currentTripId: null }),
  setCurrentTripId: (id: string | null) => set({ currentTripId: id }),
  setSelectedLocations: (locations: Location[]) => set({ selectedLocations: locations }),
  setItinerary: (itinerary: Day[]) => set({ itinerary }),
  clearTrip: () => set({ currentTrip: null, currentTripId: null, selectedLocations: [], itinerary: [] }),

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
  toggleSavedItinerary: (id: string) =>
    set((state) => ({
      savedItineraries: state.savedItineraries.includes(id)
        ? state.savedItineraries.filter((i) => i !== id)
        : [...state.savedItineraries, id],
    })),
  toggleSavedAudioGuide: (id: string) =>
    set((state) => ({
      savedAudioGuides: state.savedAudioGuides.includes(id)
        ? state.savedAudioGuides.filter((i) => i !== id)
        : [...state.savedAudioGuides, id],
    })),
  toggleSavedRoute: (id: string) =>
    set((state) => ({
      savedRoutes: state.savedRoutes.includes(id)
        ? state.savedRoutes.filter((i) => i !== id)
        : [...state.savedRoutes, id],
    })),
  toggleLikedItinerary: (id: string) =>
    set((state) => ({
      likedItineraries: state.likedItineraries.includes(id)
        ? state.likedItineraries.filter((i) => i !== id)
        : [...state.likedItineraries, id],
    })),
  toggleLikedAudioGuide: (id: string) =>
    set((state) => ({
      likedAudioGuides: state.likedAudioGuides.includes(id)
        ? state.likedAudioGuides.filter((i) => i !== id)
        : [...state.likedAudioGuides, id],
    })),
  toggleLikedRoute: (id: string) =>
    set((state) => ({
      likedRoutes: state.likedRoutes.includes(id)
        ? state.likedRoutes.filter((i) => i !== id)
        : [...state.likedRoutes, id],
    })),
}),
    {
      name: 'sololo-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user favorites + subscription counters only
        itineraryCount: state.itineraryCount,
        isPro: state.isPro,
        savedItineraries: state.savedItineraries,
        savedAudioGuides: state.savedAudioGuides,
        savedRoutes: state.savedRoutes,
        likedItineraries: state.likedItineraries,
        likedAudioGuides: state.likedAudioGuides,
        likedRoutes: state.likedRoutes,
      }),
    }
  )
)
