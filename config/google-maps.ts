// Google Maps Settings
export const googleMaps = {
  enabled: true,
  // API key should be in .env.local
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  // Map ID is required for Advanced Markers
  // Get your Map ID from: https://console.cloud.google.com/google/maps-apis/studio/maps
  // Create a new map style and copy the Map ID, then add it to .env.local as:
  // NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here
  // If not set, the code will use a default Map ID (may show warnings)
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
  // Use fallback mode (legacy markers) if Map ID is not working
  // Set to true to use google.maps.Marker instead of AdvancedMarkerElement
  useFallback: process.env.NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK === 'true' || false,
  defaultZoom: 13,
  defaultCenter: { lat: 35.6762, lng: 139.6503 }, // Tokyo default
  mapStyles: 'standard', // 'standard' | 'satellite' | 'terrain' | 'hybrid'
  markerSize: { width: 32, height: 32 },
  routeColor: '#0284c7',
  routeWidth: 4,
  animation: {
    enabled: true,
    duration: 2000,
  },
}
