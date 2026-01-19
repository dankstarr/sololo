# Map Alternatives & Solutions

This document describes alternative solutions for Google Maps when Map ID issues occur.

## Quick Fix: Use Fallback Mode

The easiest solution is to use the **GoogleMapFallback** component which uses legacy markers (no Map ID required).

### Option 1: Enable Fallback Mode (Recommended)

Add this to your `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
```

Then restart your dev server. The app will automatically use `GoogleMapFallback` which:
- ✅ Works without Map ID
- ✅ Uses legacy `google.maps.Marker` (still supported)
- ✅ Shows map tiles correctly
- ✅ Supports all basic map features

### Option 2: Manual Fallback

If Map ID is not set or empty, the app automatically falls back to `GoogleMapFallback`.

## Alternative Map Libraries

If Google Maps continues to have issues, here are alternative map libraries you can integrate:

### 1. Leaflet + OpenStreetMap (Free, Recommended)

**Pros:**
- ✅ Completely free (OpenStreetMap tiles)
- ✅ Lightweight (~40KB)
- ✅ No API key required
- ✅ Works offline
- ✅ Highly customizable

**Cons:**
- ⚠️ Requires attribution to OpenStreetMap
- ⚠️ Less polished than Google Maps
- ⚠️ No built-in directions API

**Installation:**
```bash
npm install leaflet @types/leaflet
npm install react-leaflet  # React wrapper (optional)
```

**Example Component:**
```tsx
'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function LeafletMap({ locations }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([35.6762, 139.6503], 13)
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Add markers
    locations.forEach(loc => {
      L.marker([loc.lat, loc.lng])
        .addTo(map)
        .bindPopup(loc.name)
    })

    return () => {
      map.remove()
    }
  }, [locations])

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', minHeight: '400px' }} 
    />
  )
}
```

### 2. Mapbox GL JS (Modern, Vector Tiles)

**Pros:**
- ✅ Beautiful, modern design
- ✅ Vector tiles (scalable, sharp)
- ✅ Excellent customization
- ✅ Good performance

**Cons:**
- ⚠️ Requires API token (free tier available)
- ⚠️ Larger bundle size
- ⚠️ More complex setup

**Installation:**
```bash
npm install mapbox-gl
npm install @types/mapbox-gl
```

**Setup:**
1. Get free token from https://account.mapbox.com/
2. Add to `.env.local`: `NEXT_PUBLIC_MAPBOX_TOKEN=your_token`

### 3. MapLibre GL JS (Open-Source Fork of Mapbox)

**Pros:**
- ✅ Open-source (no vendor lock-in)
- ✅ Vector tiles
- ✅ Similar API to Mapbox
- ✅ Free to use

**Cons:**
- ⚠️ Requires self-hosting tiles or using free providers
- ⚠️ More setup complexity

## Current Implementation

The app currently supports:

1. **GoogleMap** (Advanced Markers) - Requires Map ID
2. **GoogleMapFallback** (Legacy Markers) - No Map ID needed

The app automatically chooses based on:
- `NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK` env variable
- Whether Map ID is configured

## Troubleshooting

### Map not showing?

1. **Try fallback mode first:**
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
   ```

2. **Check browser console:**
   - Look for Google Maps API errors
   - Check Network tab for failed tile requests

3. **Verify API key:**
   - Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
   - Check API key has Maps JavaScript API enabled
   - Verify billing is enabled in Google Cloud Console

4. **Check Map ID (if using Advanced Markers):**
   - Verify Map ID exists in Google Cloud Console
   - Ensure Map ID is in same project as API key
   - Check Map ID format (24 hex characters)

## Migration Guide

To switch to a different map provider:

1. Install the library: `npm install <library-name>`
2. Create a new component in `components/maps/`
3. Update `components/app/MapView.tsx` to use the new component
4. Update `config/google-maps.ts` to add provider config

## Recommendations

- **For quick fix:** Use `GoogleMapFallback` (already implemented)
- **For free solution:** Consider Leaflet + OpenStreetMap
- **For production:** Fix Google Maps Map ID association (best long-term)
