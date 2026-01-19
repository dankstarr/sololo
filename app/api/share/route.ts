import { NextRequest, NextResponse } from 'next/server'
import { storeSharedItinerary, getSharedItinerary } from '@/lib/shared-itineraries-store'

// POST - Share an itinerary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trip, locations, itinerary } = body

    if (!trip || !itinerary) {
      return NextResponse.json(
        { error: 'Trip and itinerary are required' },
        { status: 400 }
      )
    }

    const shareId = storeSharedItinerary({
      trip,
      locations: locations || [],
      itinerary,
    })

    return NextResponse.json({
      shareId,
      shareUrl: `/discover/share/${shareId}`,
    })
  } catch (error) {
    console.error('Error sharing itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to share itinerary' },
      { status: 500 }
    )
  }
}

// GET - Get a shared itinerary
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shareId = searchParams.get('id')

  if (!shareId) {
    return NextResponse.json(
      { error: 'Share ID is required' },
      { status: 400 }
    )
  }

  const shared = getSharedItinerary(shareId)

  if (!shared) {
    return NextResponse.json(
      { error: 'Shared itinerary not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    id: shared.id,
    trip: shared.trip,
    locations: shared.locations,
    itinerary: shared.itinerary,
    createdAt: shared.createdAt,
    views: shared.views,
  })
}
