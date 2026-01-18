import { create } from 'zustand'

interface AppState {
  itineraryCount: number
  isPro: boolean
  incrementItineraryCount: () => void
  checkLimit: () => boolean
  upgradeToPro: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  itineraryCount: 0,
  isPro: false,
  incrementItineraryCount: () =>
    set((state) => ({ itineraryCount: state.itineraryCount + 1 })),
  checkLimit: () => {
    const state = get()
    return state.isPro || state.itineraryCount < 20
  },
  upgradeToPro: () => set({ isPro: true }),
}))
