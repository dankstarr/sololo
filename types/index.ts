// Shared TypeScript types and interfaces

export interface Location {
  id: string
  name: string
  lat?: number
  lng?: number
  address?: string
  category?: string
  image?: string
  tags?: string[]
  aiExplanation?: string
  included?: boolean
}

export interface LocationDetail {
  name: string
  description: string
  openingHours: string
  address: string
  crowdEstimate: string
  safetyNotes: string
  photos: string[]
}

export interface Day {
  id: string
  day: number
  locations: string[]
  estimatedTime: string
  distance: string
  pace: 'relaxed' | 'balanced' | 'rushed'
  notes: string
  budget: string
}

export interface Group {
  id: string
  name?: string
  destination: string
  startDate: string
  endDate: string
  memberCount: number
  maxMembers: number
  interests?: string[]
  description?: string
}

export interface TripFormData {
  destination: string
  days: string
  dates: { start: string; end: string }
  interests: string[]
  travelMode: 'walking' | 'driving' | 'mixed'
  pace: 'relaxed' | 'balanced' | 'packed'
  accessibility: boolean
}

export interface DiscoverItem {
  id: string
  type: 'trip' | 'guide' | 'route'
  title: string
  destination: string
  duration: string
  likes: number
  saves: number
  views: number
  image: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  bio?: string
  homeBase?: string
  joinedAt: string
  tripsCreated: number
  favoritesCount: number
}
