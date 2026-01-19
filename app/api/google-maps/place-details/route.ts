import { NextRequest, NextResponse } from 'next/server'
import { googleMaps } from '@/config/google-maps'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const placeId = searchParams.get('place_id')

  if (!placeId) {
    return NextResponse.json({ error: 'place_id parameter is required' }, { status: 400 })
  }

  if (!googleMaps.enabled || !googleMaps.apiKey) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,photos&key=${googleMaps.apiKey}`
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Place details error:', error)
    return NextResponse.json({ error: 'Place details failed' }, { status: 500 })
  }
}
