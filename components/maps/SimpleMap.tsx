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
  const markersRef = useRef<
    Array<{
      remove: () => void
      position: google.maps.LatLng | google.maps.LatLngLiteral
    }>
  >([])
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
        const hasMapId = Boolean(appConfig.googleMaps.mapId)
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: appConfig.googleMaps.defaultCenter,
          zoom: appConfig.googleMaps.defaultZoom,
          mapTypeId: 'roadmap',
          ...(hasMapId ? { mapId: appConfig.googleMaps.mapId } : {}),
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
    // Load Places + Advanced Marker libraries using the recommended loading=async pattern
    // See: https://developers.google.com/maps/documentation/javascript/overview#async
    script.src = `https://maps.googleapis.com/maps/api/js?key=${appConfig.googleMaps.apiKey}&libraries=marker,places&loading=async`
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

    const hasMapId = Boolean(appConfig.googleMaps.mapId)
    const useAdvancedMarkers =
      hasMapId &&
      !appConfig.googleMaps.useFallback &&
      Boolean(window.google.maps.marker?.AdvancedMarkerElement)

    const getCategoryColor = (category?: string) => {
      const c = (category || 'default').toLowerCase()
      if (c === 'you') return '#2563eb' // blue
      if (c.includes('restaurant') || c.includes('food')) return '#dc2626' // red
      if (c.includes('park') || c.includes('nature')) return '#16a34a' // green
      if (c.includes('museum') || c.includes('art')) return '#7c3aed' // purple
      if (c.includes('shopping') || c.includes('store')) return '#f59e0b' // amber
      if (c.includes('landmark') || c.includes('tourist') || c.includes('attraction')) return '#0ea5e9' // sky
      return '#6b7280' // gray
    }

    const makeMarkerIcon = (category?: string): google.maps.Icon => {
      const fill = getCategoryColor(category)
      const isYou = (category || '').toLowerCase() === 'you'

      // A simple pin SVG (not a dot), with optional halo for "You"
      const width = isYou ? 48 : 40
      const height = isYou ? 48 : 40

      const halo = isYou
        ? `<circle cx="20" cy="16" r="14" fill="${fill}" fill-opacity="0.25" />`
        : ''

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 40 40">
          ${halo}
          <path d="M20 38c6-9.2 12-15.4 12-22.2C32 9 26.6 4 20 4S8 9 8 15.8C8 22.6 14 28.8 20 38z"
                fill="${fill}" stroke="#ffffff" stroke-width="2.8" />
          <circle cx="20" cy="16" r="5.8" fill="#ffffff" fill-opacity="0.95" />
        </svg>
      `.trim()

      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`

      return {
        url,
        scaledSize: new window.google.maps.Size(width, height),
        anchor: new window.google.maps.Point(width / 2, height),
      }
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    const newMarkers: Array<{ remove: () => void; position: google.maps.LatLng | google.maps.LatLngLiteral }> = []

    if (locations.length > 0) {
      // Create markers
      locations.forEach((location) => {
        if (typeof location.lat === 'number' && typeof location.lng === 'number' && 
            !isNaN(location.lat) && !isNaN(location.lng)) {
          const category = location.category || 'default'
          const pos = { lat: location.lat, lng: location.lng }

          if (useAdvancedMarkers) {
            // Use AdvancedMarkerElement with custom SVG pin content
            const icon = makeMarkerIcon(category)
            const width = icon.scaledSize?.width || 40
            const height = icon.scaledSize?.height || 40
            
            const content = document.createElement('div')
            content.style.width = `${width}px`
            content.style.height = `${height}px`
            content.style.position = 'absolute'
            content.style.left = '0'
            content.style.top = '0'
            // Center horizontally and align bottom of pin to position
            // AdvancedMarkerElement positions content's top-left at the lat/lng
            // So we translate left by half width and up by full height
            content.style.transform = `translate(${-width / 2}px, ${-height}px)`
            content.style.transformOrigin = 'center bottom'
            content.style.pointerEvents = 'auto'
            content.style.cursor = 'pointer'
            content.innerHTML = `<img src="${icon.url}" style="width:100%;height:100%;display:block;pointer-events:none;" alt="${location.name}" />`

            const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: pos,
              title: location.name,
              content,
              zIndex: category.toLowerCase() === 'you' ? 9999 : 1000,
            })

            if (onLocationClick) {
              advancedMarker.addListener('gmp-click', () => {
                onLocationClick(location)
              })
            }

            newMarkers.push({
              position: pos,
              remove: () => {
                advancedMarker.map = null
              },
            })
          } else {
            // Fallback to legacy Marker when there is no Map ID configured
            const marker = new window.google.maps.Marker({
              position: pos,
              map,
              title: location.name,
              icon: makeMarkerIcon(category),
              zIndex: category.toLowerCase() === 'you' ? 9999 : 1000,
            })

            if (onLocationClick) {
              marker.addListener('click', () => {
                onLocationClick(location)
              })
            }

            newMarkers.push({
              position: pos,
              remove: () => {
                marker.setMap(null)
              },
            })
          }
        }
      })

      markersRef.current = newMarkers

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        newMarkers.forEach((m) => {
          bounds.extend(m.position)
        })
        
        if (bounds.getNorthEast().lat() !== bounds.getSouthWest().lat() ||
            bounds.getNorthEast().lng() !== bounds.getSouthWest().lng()) {
          map.fitBounds(bounds)
        } else {
          // Single marker - center on it
          map.setCenter(newMarkers[0].position)
          map.setZoom(15)
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
