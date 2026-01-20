// Utility functions to enrich itinerary with relevant information
import { Day, TripFormData } from '@/types'

/**
 * Generate relevant information for a trip based on destination
 */
export function enrichTripData(trip: TripFormData): TripFormData {
  const destination = trip.destination.toLowerCase()
  
  // Determine timezone, currency, and language based on destination
  const destinationInfo: Record<string, {
    timezone: string
    currency: string
    language: string[]
    emergencyContacts: Array<{ name: string; number: string; type: 'police' | 'ambulance' | 'fire' | 'embassy' | 'other' }>
    localCustoms: string[]
    culturalEtiquette: string[]
  }> = {
    'tokyo': {
      timezone: 'JST (UTC+9)',
      currency: 'Japanese Yen (JPY)',
      language: ['Japanese', 'English (limited)'],
      emergencyContacts: [
        { name: 'Police', number: '110', type: 'police' },
        { name: 'Ambulance/Fire', number: '119', type: 'ambulance' },
        { name: 'Tourist Hotline', number: '050-3816-2787', type: 'other' },
      ],
      localCustoms: [
        'Remove shoes when entering homes and some restaurants',
        'Bow when greeting people',
        'Carry cash as many places don\'t accept cards',
        'Be quiet on public transportation',
      ],
      culturalEtiquette: [
        'Avoid eating while walking',
        'Don\'t tip (it\'s considered rude)',
        'Present business cards with both hands',
        'Say "itadakimasu" before eating',
      ],
    },
    'london': {
      timezone: 'GMT/BST (UTC+0/+1)',
      currency: 'British Pound (GBP)',
      language: ['English'],
      emergencyContacts: [
        { name: 'Police/Ambulance/Fire', number: '999', type: 'police' },
        { name: 'Non-emergency', number: '101', type: 'police' },
      ],
      localCustoms: [
        'Queue properly - cutting in line is frowned upon',
        'Say "please" and "thank you" frequently',
        'Tipping is customary (10-15% in restaurants)',
        'Stand on the right side of escalators',
      ],
      culturalEtiquette: [
        'Keep to the left when walking',
        'Apologize frequently (it\'s polite)',
        'Don\'t talk loudly on public transport',
        'Respect personal space',
      ],
    },
    'paris': {
      timezone: 'CET (UTC+1)',
      currency: 'Euro (EUR)',
      language: ['French', 'English (tourist areas)'],
      emergencyContacts: [
        { name: 'Police', number: '17', type: 'police' },
        { name: 'Ambulance', number: '15', type: 'ambulance' },
        { name: 'Fire', number: '18', type: 'fire' },
      ],
      localCustoms: [
        'Greet with "Bonjour" when entering shops',
        'Dress well - Parisians value style',
        'Meal times are later (lunch 12-2pm, dinner 7-9pm)',
        'Tipping is included but rounding up is appreciated',
      ],
      culturalEtiquette: [
        'Learn basic French phrases',
        'Don\'t rush meals - dining is an experience',
        'Say "au revoir" when leaving shops',
        'Keep voice down in public spaces',
      ],
    },
  }

  // Find matching destination info
  const match = Object.keys(destinationInfo).find(key => destination.includes(key))
  const info = match ? destinationInfo[match] : {
    timezone: 'Check local timezone',
    currency: 'Check local currency',
    language: ['Check local language'],
    emergencyContacts: [
      { name: 'Police', number: 'Check local number', type: 'police' as const },
      { name: 'Ambulance', number: 'Check local number', type: 'ambulance' as const },
    ],
    localCustoms: ['Research local customs before traveling'],
    culturalEtiquette: ['Research cultural etiquette before traveling'],
  }

  // Generate weather info based on dates
  const startDate = trip.dates?.start ? new Date(trip.dates.start) : new Date()
  const month = startDate.getMonth() + 1 // 1-12
  const season = month >= 3 && month <= 5 ? 'Spring' :
                 month >= 6 && month <= 8 ? 'Summer' :
                 month >= 9 && month <= 11 ? 'Fall' : 'Winter'

  return {
    ...trip,
    timezone: info.timezone,
    currency: info.currency,
    language: info.language,
    emergencyContacts: info.emergencyContacts,
    localCustoms: info.localCustoms,
    culturalEtiquette: info.culturalEtiquette,
    weather: {
      season,
      forecast: `Typical ${season} weather - check forecast closer to travel date`,
      averageTemperature: season === 'Spring' ? '15-20°C' :
                          season === 'Summer' ? '25-30°C' :
                          season === 'Fall' ? '15-20°C' : '5-10°C',
    },
    packingList: generatePackingList(season, trip.travelMode),
    localTransportation: {
      options: trip.travelMode === 'walking' 
        ? ['Walking', 'Public transport', 'Taxis']
        : trip.travelMode === 'driving'
        ? ['Car rental', 'Rideshare', 'Public transport']
        : ['Public transport', 'Walking', 'Taxis', 'Car rental'],
      tips: 'Research local transportation options and purchase passes in advance',
      cost: 'Varies by destination - check local transport websites',
    },
    moneyTips: [
      'Notify your bank before traveling',
      'Carry some local currency cash',
      'Use credit cards with no foreign transaction fees',
      'Keep emergency cash separate',
    ],
    communicationTips: [
      'Download offline maps',
      'Get a local SIM card or use eSIM',
      'Download translation apps',
      'Save important addresses in local language',
    ],
  }
}

/**
 * Generate relevant information for a day based on locations and travel mode
 */
export function enrichDayData(day: Day, dayNumber: number, travelMode: 'walking' | 'driving' | 'mixed'): Day {
  const locationCount = day.locations.length
  
  // Best time to visit based on day number and pace
  const bestTimeToVisit = day.pace === 'relaxed' 
    ? '9:00 AM - 10:00 AM (avoid crowds)'
    : day.pace === 'balanced'
    ? '8:00 AM - 9:00 AM (optimal start time)'
    : '7:00 AM - 8:00 AM (early start for packed schedule)'

  // Generate local tips based on location count and travel mode
  const localTips: string[] = []
  if (travelMode === 'walking') {
    localTips.push('Wear comfortable walking shoes')
    localTips.push('Stay hydrated and take breaks')
    if (locationCount > 4) {
      localTips.push('Consider using public transport between distant locations')
    }
  } else if (travelMode === 'driving') {
    localTips.push('Check parking availability at each location')
    localTips.push('Consider traffic patterns when planning')
    localTips.push('Have a backup parking plan')
  } else {
    localTips.push('Mix of walking and transportation - plan accordingly')
  }

  if (day.pace === 'rushed') {
    localTips.push('Prioritize must-see locations')
    localTips.push('Book skip-the-line tickets in advance')
  }

  // Generate transportation info
  const transportation = {
    mode: travelMode === 'walking' ? 'Walking + Public Transport' :
          travelMode === 'driving' ? 'Driving + Walking' :
          'Mixed (Walking + Public Transport + Driving)',
    cost: travelMode === 'walking' ? '$5-15 (public transport)' :
          travelMode === 'driving' ? '$30-50 (parking + fuel)' :
          '$15-30 (mixed)',
    duration: day.estimatedTime,
    tips: travelMode === 'walking' 
      ? 'Use day passes for public transport to save money'
      : travelMode === 'driving'
      ? 'Book parking in advance for popular locations'
      : 'Use public transport for long distances, walk for short ones',
  }

  // Generate photo spots (top 2-3 locations are usually good photo spots)
  const photoSpots = day.locations.slice(0, Math.min(3, locationCount))

  // Generate nearby restaurants (generic suggestions)
  const nearbyRestaurants = [
    { name: 'Local Cafe', cuisine: 'Local', priceRange: '$$', distance: '0.2 km' },
    { name: 'Restaurant Nearby', cuisine: 'Various', priceRange: '$$$', distance: '0.5 km' },
  ]

  // Safety tips
  const safetyTips = [
    'Keep valuables secure and out of sight',
    'Be aware of your surroundings',
    'Have emergency contact numbers saved',
    'Share your itinerary with someone back home',
  ]

  // Cultural notes
  const culturalNotes = [
    'Respect local customs and traditions',
    'Dress appropriately for religious sites',
    'Ask permission before taking photos of people',
  ]

  // Packing suggestions for the day
  const packingSuggestions = [
    'Water bottle',
    'Comfortable shoes',
    'Weather-appropriate clothing',
    'Camera/phone',
    'Map or GPS device',
    'Snacks',
  ]

  return {
    ...day,
    bestTimeToVisit,
    localTips,
    transportation,
    photoSpots,
    nearbyRestaurants,
    safetyTips,
    culturalNotes,
    packingSuggestions,
    weather: {
      forecast: 'Check weather forecast for this day',
      bestTimeToVisit: bestTimeToVisit,
      temperature: 'Check local forecast',
    },
  }
}

/**
 * Generate packing list based on season and travel mode
 */
function generatePackingList(season: string, travelMode: 'walking' | 'driving' | 'mixed'): string[] {
  const base = [
    'Passport and travel documents',
    'Travel insurance documents',
    'Credit/debit cards',
    'Local currency cash',
    'Phone and charger',
    'Power adapter',
    'First aid kit',
  ]

  const seasonal = season === 'Spring' || season === 'Fall'
    ? ['Light jacket', 'Layers', 'Umbrella']
    : season === 'Summer'
    ? ['Sunscreen', 'Hat', 'Light clothing', 'Sunglasses']
    : ['Warm jacket', 'Gloves', 'Scarf', 'Warm layers']

  const modeSpecific = travelMode === 'walking'
    ? ['Comfortable walking shoes', 'Backpack', 'Water bottle']
    : travelMode === 'driving'
    ? ['Driver\'s license', 'Car rental documents', 'GPS device']
    : ['Comfortable shoes', 'Public transport pass', 'Backpack']

  return [...base, ...seasonal, ...modeSpecific]
}
