import { NextRequest, NextResponse } from 'next/server'
import { googleMaps } from '@/config/google-maps'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '5000'
  const type = searchParams.get('type')

  if (!query || !lat || !lng) {
    return NextResponse.json({ error: 'Query, lat, and lng parameters are required' }, { status: 400 })
  }

  if (!googleMaps.enabled || !googleMaps.apiKey) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${googleMaps.apiKey}`
    
    if (type) {
      url += `&type=${type}`
    }

    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Places search error:', error)
    return NextResponse.json({ error: 'Places search failed' }, { status: 500 })
  }
}
