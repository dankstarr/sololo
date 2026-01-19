'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Map,
  Filter,
  ExternalLink,
  List,
  Download,
  ArrowLeft,
} from 'lucide-react'
import LocationDetail from './LocationDetail'
import { SimpleMap } from '@/components/maps'
import { FilterPanel, DaySelector, OfflineIndicator } from '@/components/common'
import { Button } from '@/components/ui'
import { openInGoogleMaps, createGoogleMapsList } from '@/lib/utils'
import { googleMaps } from '@/config/google-maps'
import { useOffline } from '@/hooks'
import { useAppStore } from '@/store/useAppStore'

export default function MapView() {
  const router = useRouter()
  const { itinerary, selectedLocations, currentTrip } = useAppStore()
  const [selectedDay, setSelectedDay] = useState<number | null>(1)
  const [filters, setFilters] = useState({
    food: true,
    culture: true,
    scenic: true,
  })
  const [showFilters, setShowFilters] = useState(false)
  const isOffline = useOffline()
  const [downloaded, setDownloaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string
    category: string
  } | null>(null)

  // Convert itinerary days to map format
  const days = itinerary.length > 0 
    ? itinerary.map((day, index) => ({
        id: day.day,
        name: `Day ${day.day}`,
        color: index % 2 === 0 ? 'bg-blue-500' : 'bg-green-500',
        locations: day.locations.map(locName => {
          const location = selectedLocations.find(l => l.name === locName)
          return {
            name: locName,
            category: location?.category || 'culture',
            lat: location?.lat || 35.6762,
            lng: location?.lng || 139.6503,
          }
        }),
      }))
    : [
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

      {/* Google Map */}
      {googleMaps.enabled && googleMaps.apiKey ? (
        <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
          {/* SimpleMap - easiest and most foolproof map component */}
          <SimpleMap
            locations={
              selectedDay
                ? days.find((d) => d.id === selectedDay)?.locations || []
                : days[0]?.locations || []
            }
            selectedDay={selectedDay || 1}
            onLocationClick={(location) =>
              setSelectedLocation({
                name: location.name,
                category: 'culture',
              })
            }
            showRoute={false}
            routeColor={googleMaps.routeColor}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-100 to-blue-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Google Maps integration would appear here
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Configure Google Maps API key in .env.local
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-4">
        {/* Offline Status */}
        <OfflineIndicator />

        {/* Day Selector */}
        <DaySelector
          days={days.map(d => ({ id: d.id, name: d.name }))}
          selectedDay={selectedDay}
          onDaySelect={(dayId) => setSelectedDay(typeof dayId === 'string' ? parseInt(dayId, 10) : dayId)}
        />

        {/* Filter Button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="secondary"
          size="medium"
          icon={<Filter className="w-5 h-5" />}
          className="min-w-[44px]"
        />
      </div>

      {/* Filters Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}
      />

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-xl p-3 md:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                const currentDay = days.find((d) => d.id === selectedDay)
                if (currentDay && currentDay.locations.length > 0) {
                  const firstLocation = currentDay.locations[0]
                  openInGoogleMaps({
                    name: firstLocation.name,
                    lat: firstLocation.lat,
                    lng: firstLocation.lng,
                  })
                } else {
                  openInGoogleMaps({ name: 'Tokyo, Japan' })
                }
              }}
              fullWidth
              icon={<ExternalLink className="w-4 h-4 md:w-5 md:h-5" />}
            >
              <span className="hidden sm:inline">Open in Google Maps</span>
              <span className="sm:hidden">Google Maps</span>
            </Button>
            <Button
              onClick={() => {
                const currentDay = days.find((d) => d.id === selectedDay)
                if (currentDay) {
                  createGoogleMapsList(currentDay.locations)
                }
              }}
              variant="outline"
              fullWidth
              icon={<List className="w-4 h-4 md:w-5 md:h-5" />}
            >
              <span className="hidden sm:inline">Create Google Maps List</span>
              <span className="sm:hidden">Create List</span>
            </Button>
          </div>
          <Button
            onClick={() => {
              setDownloaded(true)
              alert('Downloading routes, maps, and audio guides for offline use...')
            }}
            variant={downloaded ? 'secondary' : 'secondary'}
            fullWidth
            icon={<Download className="w-4 h-4 md:w-5 md:h-5" />}
            className={downloaded ? 'bg-green-100 text-green-700 border-2 border-green-300' : ''}
          >
            {downloaded ? 'Downloaded for Offline' : 'Download for Offline'}
          </Button>
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

      {/* Location Detail Modal */}
      {selectedLocation && (
        <LocationDetail
          location={{
            name: selectedLocation.name,
            description: `Explore ${selectedLocation.name}, a ${selectedLocation.category} destination with rich history and culture.`,
            openingHours: '9:00 AM - 6:00 PM',
            address: 'Tokyo, Japan',
            crowdEstimate: 'Moderate',
            safetyNotes: 'Generally safe area. Watch for pickpockets in crowded areas.',
            photos: [],
          }}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  )
}
