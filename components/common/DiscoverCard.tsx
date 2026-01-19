'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import Link from 'next/link'

interface City {
  id: string
  name: string
  country: string | null
  lat: number
  lng: number
  search_count: number
  is_major: boolean
  locationCount: number
}

interface DiscoverCardProps {
  // No longer needed - cities navigate directly
}

export default function DiscoverCard({}: DiscoverCardProps) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCities = async () => {
      try {
        console.log('[API] GET /api/cities - Fetching cities list')
        const startTime = performance.now()
        const res = await fetch('/api/cities')
        const duration = performance.now() - startTime
        
        if (res.ok) {
          const data = await res.json()
          const citiesList = data.cities || []
          
          // Additional client-side deduplication as safety measure
          const deduplicatedCities = citiesList.reduce((acc: City[], city: City) => {
            const key = `${city.name.toLowerCase().trim()}_${(city.country || '').toLowerCase().trim()}`
            const existingIndex = acc.findIndex(
              (c) => `${c.name.toLowerCase().trim()}_${(c.country || '').toLowerCase().trim()}` === key
            )
            
            if (existingIndex === -1) {
              acc.push(city)
            } else {
              // Keep the one with more locations or higher search count
              const existing = acc[existingIndex]
              if (city.locationCount > existing.locationCount || 
                  (city.locationCount === existing.locationCount && city.search_count > existing.search_count)) {
                acc[existingIndex] = city
              }
            }
            
            return acc
          }, [])
          
          console.log(`[API] GET /api/cities - Success (${duration.toFixed(2)}ms) - Found ${citiesList.length} cities, displaying ${deduplicatedCities.length} unique cities`)
          setCities(deduplicatedCities)
        } else {
          console.error(`[API] GET /api/cities - Failed (${res.status}) - ${res.statusText}`)
        }
      } catch (error) {
        console.error('[API] GET /api/cities - Error:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchCities()
  }, [])

  const getCityUrl = (city: City) => {
    const params = new URLSearchParams()
    params.set('cityId', city.id)
    params.set('lat', city.lat.toString())
    params.set('lng', city.lng.toString())
    params.set('radius', '10')
    params.set('q', city.name + (city.country ? `, ${city.country}` : ''))
    return `/discover/locations?${params.toString()}`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading cities...</span>
        </div>
      </Card>
    )
  }

  if (cities.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Discover Cities</h2>
        <p className="text-sm text-gray-600">
          Start searching for cities to see them appear here. Major cities like London will be saved automatically.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Discover Cities</h2>
          <p className="text-sm text-gray-600 mt-1">
            Explore popular locations in cities that have been searched
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={getCityUrl(city)}
            className="group"
          >
            <div className="border rounded-xl transition-all border-gray-200 hover:border-primary hover:shadow-md bg-white p-4 h-full flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {city.name}
                      {city.country && (
                        <span className="text-gray-500 font-normal">, {city.country}</span>
                      )}
                    </h3>
                    {city.is_major && (
                      <Badge variant="default" className="text-xs flex-shrink-0">
                        Major
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {city.locationCount} location{city.locationCount !== 1 ? 's' : ''}
                  </span>
                  {city.search_count > 1 && (
                    <span className="text-xs text-gray-500">
                      {city.search_count}× searched
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
