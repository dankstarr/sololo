import { NextRequest, NextResponse } from 'next/server'
import { googleMaps } from '@/config/google-maps'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const mode = searchParams.get('mode') || 'walking'
  const waypoints = searchParams.get('waypoints')

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination parameters are required' }, { status: 400 })
  }

  if (!googleMaps.enabled || !googleMaps.apiKey) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${googleMaps.apiKey}`
    
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`
    }

    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Directions error:', error)
    return NextResponse.json({ error: 'Directions failed' }, { status: 500 })
  }
}
