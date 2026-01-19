'use client'

/**
 * SimpleMap - The easiest and most foolproof Google Maps component
 * Only requires an API key - no Map ID needed
 * Uses standard Google Maps with legacy markers
 */

import { useEffect, useRef, useState } from 'react'
import appConfig from '@/config/app.config'

interface SimpleMapProps {
  locations: Array<{ name: string; lat: number; lng: number; category?: string }>
  selectedDay?: number
  onLocationClick?: (location: { name: string; lat: number; lng: number }) => void
  showRoute?: boolean
  routeColor?: string
}

export default function SimpleMap({
  locations,
  selectedDay,
  onLocationClick,
  showRoute = false,
  routeColor = '#0284c7',
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load Google Maps script and initialize map
  useEffect(() => {
    if (!appConfig.googleMaps.apiKey) {
      setError('Google Maps API key not configured')
      setIsLoading(false)
      return
    }

    if (!mapRef.current) {
      return
    }

    let isMounted = true

    // Function to initialize map once API is loaded
    const initializeMap = () => {
      if (!isMounted || !mapRef.current || !window.google?.maps?.Map) return

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: appConfig.googleMaps.defaultCenter,
          zoom: appConfig.googleMaps.defaultZoom,
          mapTypeId: 'roadmap',
        })

        if (isMounted) {
          setMap(mapInstance)
          setIsLoading(false)

          // Trigger resize after a short delay to ensure proper rendering
          setTimeout(() => {
            if (mapInstance && window.google) {
              window.google.maps.event.trigger(mapInstance, 'resize')
            }
          }, 300)
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to initialize map')
          setIsLoading(false)
        }
      }
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script exists, wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkLoaded)
          initializeMap()
        }
      }, 100)
      return () => {
        isMounted = false
        clearInterval(checkLoaded)
      }
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${appConfig.googleMaps.apiKey}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setTimeout(initializeMap, 100)
    }
    
    script.onerror = () => {
      if (isMounted) {
        setError('Failed to load Google Maps')
        setIsLoading(false)
      }
    }
    
    document.head.appendChild(script)

    return () => {
      isMounted = false
    }
  }, [])

  // Update markers when map or locations change
  useEffect(() => {
    if (!map || !window.google) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    if (locations.length > 0) {
      // Create markers
      locations.forEach((location) => {
        if (typeof location.lat === 'number' && typeof location.lng === 'number' && 
            !isNaN(location.lat) && !isNaN(location.lng)) {
          const marker = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
          })

          if (onLocationClick) {
            marker.addListener('click', () => {
              onLocationClick(location)
            })
          }

          newMarkers.push(marker)
        }
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        newMarkers.forEach(marker => {
          const pos = marker.getPosition()
          if (pos) bounds.extend(pos)
        })
        
        if (bounds.getNorthEast().lat() !== bounds.getSouthWest().lat() ||
            bounds.getNorthEast().lng() !== bounds.getSouthWest().lng()) {
          map.fitBounds(bounds)
        } else {
          // Single marker - center on it
          const firstMarker = newMarkers[0]
          const pos = firstMarker.getPosition()
          if (pos) {
            map.setCenter(pos)
            map.setZoom(15)
          }
        }
      }
    } else {
      // No locations - center on default
      map.setCenter(appConfig.googleMaps.defaultCenter)
      map.setZoom(appConfig.googleMaps.defaultZoom)
    }
  }, [map, locations, onLocationClick])

  if (!appConfig.googleMaps.apiKey) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center p-4">
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-gray-500 text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold mb-2">Map Error</p>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ 
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }} 
      />
    </div>
  )
}
