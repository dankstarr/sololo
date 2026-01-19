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
  // Additional relevant information
  weather?: {
    forecast?: string
    bestTimeToVisit?: string
    temperature?: string
  }
  localTips?: string[]
  transportation?: {
    mode?: string
    cost?: string
    duration?: string
    tips?: string
  }
  bestTimeToVisit?: string // Best time of day for this day's itinerary
  photoSpots?: string[]
  nearbyRestaurants?: Array<{
    name: string
    cuisine?: string
    priceRange?: string
    distance?: string
  }>
  safetyTips?: string[]
  culturalNotes?: string[]
  packingSuggestions?: string[]
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
  theme?: string
  // Additional relevant information
  weather?: {
    forecast?: string
    season?: string
    averageTemperature?: string
  }
  timezone?: string
  currency?: string
  language?: string[]
  emergencyContacts?: Array<{
    name: string
    number: string
    type: 'police' | 'ambulance' | 'fire' | 'embassy' | 'other'
  }>
  localCustoms?: string[]
  packingList?: string[]
  visaInfo?: string
  vaccinationInfo?: string
  localTransportation?: {
    options?: string[]
    tips?: string
    cost?: string
  }
  culturalEtiquette?: string[]
  moneyTips?: string[]
  communicationTips?: string[]
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

export interface Collaborator {
  id: string
  itinerary_id: string
  user_id: string
  role: 'viewer' | 'editor' | 'admin'
  invited_by?: string
  invited_at: string
  joined_at?: string
}

export interface EditHistoryEntry {
  id: string
  itinerary_id: string
  user_id: string
  action_type: 'trip_updated' | 'location_added' | 'location_removed' | 'location_moved' | 'day_added' | 'day_removed' | 'collaborator_added' | 'collaborator_removed' | 'collaborator_role_updated' | 'itinerary_updated'
  details: Record<string, any>
  previous_state?: Record<string, any> | null
  created_at: string
}
