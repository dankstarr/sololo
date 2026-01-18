'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import {
  Heart,
  Bookmark,
  Eye,
  MapPin,
  Clock,
  Headphones,
  Route,
  Filter,
} from 'lucide-react'

interface DiscoverItem {
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

export default function DiscoverPage() {
  const [filter, setFilter] = useState<'all' | 'trip' | 'guide' | 'route'>(
    'all'
  )

  const items: DiscoverItem[] = [
    {
      id: '1',
      type: 'trip',
      title: 'Tokyo 5-Day Cultural Journey',
      destination: 'Tokyo, Japan',
      duration: '5 days',
      likes: 124,
      saves: 89,
      views: 1200,
      image: '/placeholder-tokyo.jpg',
    },
    {
      id: '2',
      type: 'guide',
      title: 'Senso-ji Temple Audio Guide',
      destination: 'Tokyo, Japan',
      duration: '15 min',
      likes: 67,
      saves: 45,
      views: 890,
      image: '/placeholder-temple.jpg',
    },
    {
      id: '3',
      type: 'route',
      title: 'Kyoto Temple Circuit',
      destination: 'Kyoto, Japan',
      duration: '6 hours',
      likes: 203,
      saves: 156,
      views: 2100,
      image: '/placeholder-kyoto.jpg',
    },
    {
      id: '4',
      type: 'trip',
      title: 'Paris Art & History Tour',
      destination: 'Paris, France',
      duration: '4 days',
      likes: 189,
      saves: 134,
      views: 1500,
      image: '/placeholder-paris.jpg',
    },
  ]

  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((item) => item.type === filter)

  return (
    <div className="container mx-auto px-6 py-8">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Discover</h1>
          <p className="text-gray-600">
            Explore trips, audio guides, and routes created by the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <Filter className="w-5 h-5 text-gray-600" />
          {(['all', 'trip', 'guide', 'route'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'trip' ? 'Trips' : f === 'guide' ? 'Guides' : 'Routes'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <m.div
              key={item.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.3 }}
            >
              {/* Image Placeholder */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                <span className="text-gray-400 text-sm">Image</span>
                <div className="absolute top-3 right-3">
                  {item.type === 'guide' && (
                    <div className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      Audio
                    </div>
                  )}
                  {item.type === 'route' && (
                    <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      Route
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{item.destination}</span>
                  <span className="text-gray-400">•</span>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{item.duration}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{item.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-4 h-4" />
                      <span>{item.saves}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{item.views}</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all text-sm">
                    View
                  </button>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </div>
  )
}
