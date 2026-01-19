import { NextResponse } from 'next/server'
import { listSharedItineraries } from '@/lib/shared-itineraries-store'

// GET - List all shared itineraries (for discover page)
export async function GET() {
  const shared = listSharedItineraries(50)
  return NextResponse.json(shared)
}
