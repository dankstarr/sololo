'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Map,
  Filter,
  ExternalLink,
  List,
  X,
  Utensils,
  Landmark,
  Mountain,
  Download,
  Wifi,
  WifiOff,
  ArrowLeft,
} from 'lucide-react'

export default function MapView() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<number | null>(1)
  const [filters, setFilters] = useState({
    food: true,
    culture: true,
    scenic: true,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const days = [
    {
      id: 1,
      name: 'Day 1',
      color: 'bg-blue-500',
      locations: [
        { name: 'Senso-ji Temple', category: 'culture', lat: 35.7148, lng: 139.7967 },
        { name: 'Tsukiji Market', category: 'food', lat: 35.6654, lng: 139.7706 },
        { name: 'Tokyo Skytree', category: 'scenic', lat: 35.7101, lng: 139.8107 },
      ],
    },
    {
      id: 2,
      name: 'Day 2',
      color: 'bg-green-500',
      locations: [
        { name: 'Shibuya Crossing', category: 'culture', lat: 35.6598, lng: 139.7006 },
        { name: 'Meiji Shrine', category: 'culture', lat: 35.6764, lng: 139.6993 },
        { name: 'Harajuku', category: 'culture', lat: 35.6702, lng: 139.7026 },
      ],
    },
  ]

  return (
    <div className="relative h-screen w-full">
      {/* Back Button */}
      <div className="absolute top-20 left-4 z-20">
        <button
          onClick={() => router.push('/app/itinerary')}
          className="bg-white rounded-lg shadow-lg px-3 md:px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Back to Itinerary</span>
          <span className="text-xs md:text-sm font-medium sm:hidden">Back</span>
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Map className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            Google Maps integration would appear here
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Showing circular routes with animated drawing
          </p>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-4">
        {/* Offline Status */}
        <div className="bg-white rounded-lg shadow-lg px-3 md:px-4 py-2 flex items-center gap-2">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-xs md:text-sm text-gray-700">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-xs md:text-sm text-gray-700">Online</span>
            </>
          )}
        </div>

        {/* Day Selector */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                  selectedDay === day.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.name}
              </button>
            ))}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-all"
        >
          <Filter className="w-5 h-5 text-gray-700" />
        </button>
      </div>

        {/* Filters Panel */}
        {showFilters && (
          <m.div
            className="absolute top-20 left-4 bg-white rounded-lg shadow-xl p-4 z-20 min-w-[200px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { key: 'food', label: 'Food', icon: Utensils },
              { key: 'culture', label: 'Culture', icon: Landmark },
              { key: 'scenic', label: 'Scenic', icon: Mountain },
            ].map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters[key as keyof typeof filters]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-600"
                />
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </m.div>
      )}

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Open in Google Maps</span>
              <span className="sm:hidden">Google Maps</span>
            </button>
            <button className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
              <List className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Create Google Maps List</span>
              <span className="sm:hidden">Create List</span>
            </button>
          </div>
          <button
            onClick={() => {
              setDownloaded(true)
              alert('Downloading routes, maps, and audio guides for offline use...')
            }}
            className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
              downloaded
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            {downloaded ? 'Downloaded for Offline' : 'Download for Offline'}
          </button>
        </div>
      </div>

      {/* Color Legend */}
      <div className="absolute bottom-24 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Categories</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Food</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Culture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Scenic</span>
          </div>
        </div>
      </div>
    </div>
  )
}
