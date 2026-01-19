import { create } from 'zustand'
import { Location, TripFormData, Day, Group } from '@/types'

interface AppState {
  // User & Subscription
  itineraryCount: number
  isPro: boolean
  incrementItineraryCount: () => void
  checkLimit: () => boolean
  upgradeToPro: () => void

  // Current Trip Data
  currentTrip: TripFormData | null
  selectedLocations: Location[]
  itinerary: Day[]
  setCurrentTrip: (trip: TripFormData) => void
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
  toggleSavedItinerary: (id: string) => void
  toggleSavedAudioGuide: (id: string) => void
  toggleSavedRoute: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
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

  // Current Trip Data
  currentTrip: null,
  selectedLocations: [],
  itinerary: [],
  setCurrentTrip: (trip: TripFormData) => set({ currentTrip: trip }),
  setSelectedLocations: (locations: Location[]) => set({ selectedLocations: locations }),
  setItinerary: (itinerary: Day[]) => set({ itinerary }),
  clearTrip: () => set({ currentTrip: null, selectedLocations: [], itinerary: [] }),

  // Groups
  groups: [],
  currentGroup: null,
  setGroups: (groups: Group[]) => set({ groups }),
  setCurrentGroup: (group: Group | null) => set({ currentGroup: group }),
  addGroup: (group: Group) => set((state) => ({ groups: [...state.groups, group] })),

  // Saved Items
  savedItineraries: [],
  savedAudioGuides: [],
  savedRoutes: [],
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
}))
