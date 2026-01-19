// Sample Data for Development/Demo
export const defaultTrip = {
  destination: 'Tokyo, Japan',
  days: 5,
  startDate: '2024-06-01',
  endDate: '2024-06-05',
  interests: ['food', 'culture', 'history'],
  travelMode: 'walking',
  pace: 'balanced',
}

export const sampleLocations = [
  {
    id: '1',
    name: 'Senso-ji Temple',
    image: undefined, // Will use placeholder from getImageUrl
    tags: ['culture', 'history', 'scenic'],
    aiExplanation: "Tokyo's oldest temple, perfect for experiencing traditional Japanese culture. Great for morning visits to avoid crowds.",
    category: 'culture',
  },
  {
    id: '2',
    name: 'Tsukiji Outer Market',
    image: undefined,
    tags: ['food', 'local gem'],
    aiExplanation: 'Authentic food market with fresh sushi and local snacks. Best visited early morning for the freshest experience.',
    category: 'food',
  },
  {
    id: '3',
    name: 'Shibuya Crossing',
    image: undefined,
    tags: ['culture', 'scenic'],
    aiExplanation: 'Iconic intersection representing modern Tokyo. Best viewed from Shibuya Sky or nearby cafes.',
    category: 'culture',
  },
  {
    id: '4',
    name: 'Meiji Shrine',
    image: undefined,
    tags: ['culture', 'nature', 'scenic'],
    aiExplanation: 'Peaceful shrine surrounded by forest in the heart of the city. A calm escape from urban Tokyo.',
    category: 'culture',
  },
  {
    id: '5',
    name: 'TeamLab Borderless',
    image: undefined,
    tags: ['art', 'scenic'],
    aiExplanation: "Immersive digital art experience. Book tickets in advance as it's very popular.",
    category: 'art',
  },
]

export const sampleGroups = [
  {
    id: '1',
    destination: 'Tokyo, Japan',
    startDate: '2024-06-01',
    endDate: '2024-06-05',
    memberCount: 3,
    maxMembers: 6,
    interests: ['food', 'culture'],
  },
  {
    id: '2',
    destination: 'Kyoto, Japan',
    startDate: '2024-06-10',
    endDate: '2024-06-14',
    memberCount: 5,
    maxMembers: 8,
    interests: ['history', 'nature'],
  },
]

export const sampleDiscoverItems = [
  {
    id: '1',
    type: 'trip',
    title: 'Perfect 5-Day Tokyo Itinerary',
    destination: 'Tokyo, Japan',
    duration: '5 days',
    likes: 234,
    saves: 89,
    views: 1200,
    image: undefined, // Will use placeholder from getImageUrl
  },
  {
    id: '2',
    type: 'guide',
    title: 'Senso-ji Temple Audio Guide',
    destination: 'Tokyo, Japan',
    duration: '15 min',
    likes: 156,
    saves: 67,
    views: 890,
    image: undefined,
  },
  {
    id: '3',
    type: 'route',
    title: 'Historic Kyoto Walking Route',
    destination: 'Kyoto, Japan',
    duration: '3 hours',
    likes: 189,
    saves: 92,
    views: 1100,
    image: undefined,
  },
]

export const placeholderImages = {
  location: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  discover: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop',
  user: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  trip: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
}
