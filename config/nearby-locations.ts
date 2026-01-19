// Sample London locations for Nearby Discovery page
export interface NearbyLocation {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  distance: string
  image?: string
  description?: string
}

export const londonLocations: NearbyLocation[] = [
  {
    id: '1',
    name: 'Tower of London',
    category: 'Historic Site',
    rating: 4.8,
    reviewCount: 12543,
    distance: '0.5 km',
  },
  {
    id: '2',
    name: 'British Museum',
    category: 'Museum',
    rating: 4.7,
    reviewCount: 8921,
    distance: '1.2 km',
  },
  {
    id: '3',
    name: 'Buckingham Palace',
    category: 'Historic Site',
    rating: 4.6,
    reviewCount: 15678,
    distance: '2.1 km',
  },
  {
    id: '4',
    name: 'Westminster Abbey',
    category: 'Historic Site',
    rating: 4.8,
    reviewCount: 11234,
    distance: '1.8 km',
  },
  {
    id: '5',
    name: 'London Eye',
    category: 'Attraction',
    rating: 4.5,
    reviewCount: 9876,
    distance: '1.5 km',
  },
  {
    id: '6',
    name: 'Tate Modern',
    category: 'Museum',
    rating: 4.7,
    reviewCount: 7654,
    distance: '0.8 km',
  },
  {
    id: '7',
    name: 'Hyde Park',
    category: 'Park',
    rating: 4.6,
    reviewCount: 5432,
    distance: '2.5 km',
  },
  {
    id: '8',
    name: 'Covent Garden',
    category: 'Shopping',
    rating: 4.4,
    reviewCount: 8765,
    distance: '1.1 km',
  },
  {
    id: '9',
    name: 'St. Paul\'s Cathedral',
    category: 'Historic Site',
    rating: 4.7,
    reviewCount: 6543,
    distance: '0.9 km',
  },
  {
    id: '10',
    name: 'Camden Market',
    category: 'Market',
    rating: 4.3,
    reviewCount: 4321,
    distance: '3.2 km',
  },
  {
    id: '11',
    name: 'Shakespeare\'s Globe',
    category: 'Theater',
    rating: 4.6,
    reviewCount: 3210,
    distance: '1.0 km',
  },
  {
    id: '12',
    name: 'Natural History Museum',
    category: 'Museum',
    rating: 4.8,
    reviewCount: 10987,
    distance: '2.8 km',
  },
  {
    id: '13',
    name: 'Borough Market',
    category: 'Market',
    rating: 4.5,
    reviewCount: 5678,
    distance: '0.7 km',
  },
  {
    id: '14',
    name: 'Kensington Palace',
    category: 'Historic Site',
    rating: 4.4,
    reviewCount: 3456,
    distance: '3.1 km',
  },
  {
    id: '15',
    name: 'Victoria and Albert Museum',
    category: 'Museum',
    rating: 4.7,
    reviewCount: 7890,
    distance: '2.6 km',
  },
]
