import { NextRequest, NextResponse } from 'next/server'
import { googleMaps } from '@/config/google-maps'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const input = searchParams.get('input')
  const location = searchParams.get('location') // Optional: "lat,lng" for biasing results

  if (!input) {
    return NextResponse.json({ error: 'input parameter is required' }, { status: 400 })
  }

  if (!googleMaps.enabled || !googleMaps.apiKey) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${googleMaps.apiKey}`
    
    // Add location bias if provided (helps prioritize results near user)
    if (location) {
      url += `&location=${location}&radius=50000`
    }

    const response = await fetch(url)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json({ error: 'Autocomplete failed' }, { status: 500 })
  }
}
