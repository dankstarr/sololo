'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Route, DollarSign, MapPin } from 'lucide-react'
import Footer from '@/components/marketing/Footer'
import { useAppStore } from '@/store/useAppStore'
import { trackedFetch } from '@/lib/utils/tracked-fetch'

interface SharedItinerary {
  id: string
  trip: {
    destination: string
    days: string
    interests: string[]
  }
  locations: any[]
  itinerary: any[]
  createdAt: number
  views: number
}

export default function SharedItineraryPage() {
  const params = useParams()
  const router = useRouter()
  const { setCurrentTrip, setSelectedLocations, setItinerary } = useAppStore()
  const [itinerary, setItineraryData] = useState<SharedItinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedItinerary = async () => {
      try {
        const response = await trackedFetch(`/api/share?id=${params.id}`)
        if (!response.ok) {
          throw new Error('Shared itinerary not found')
        }
        const data = await response.json()
        setItineraryData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared itinerary')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSharedItinerary()
    }
  }, [params.id])

  const handleUseItinerary = () => {
    if (!itinerary) return

    setCurrentTrip({
      destination: itinerary.trip.destination,
      days: itinerary.trip.days,
      dates: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + parseInt(itinerary.trip.days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      interests: itinerary.trip.interests || [],
      travelMode: 'walking',
      pace: 'balanced',
      accessibility: false,
    })
    setSelectedLocations(itinerary.locations)
    setItinerary(itinerary.itinerary)

    router.push('/app/itinerary')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared itinerary...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !itinerary) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Shared itinerary not found'}</p>
          <button
            onClick={() => router.push('/discover')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all"
          >
            Back to Discover
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/discover')}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Discover
              </button>
              <button
                onClick={() => router.push('/app/home')}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Plan Trip
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {itinerary.trip.destination}
                </h1>
                <p className="text-gray-600">
                  {itinerary.trip.days} days • {itinerary.views} views
                </p>
                {itinerary.trip.interests && itinerary.trip.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {itinerary.trip.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-secondary text-primary rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleUseItinerary}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all"
              >
                Use This Itinerary
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {itinerary.itinerary.map((day: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {day.day || idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Day {day.day || idx + 1}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {day.estimatedTime || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Route className="w-4 h-4" />
                          {day.distance || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {day.budget || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Locations</h4>
                    <ul className="space-y-2">
                      {day.locations?.map((location: string, locIdx: number) => (
                        <li
                          key={locIdx}
                          className="flex items-center gap-2 text-gray-700"
                        >
                          <span className="w-6 h-6 bg-primary-100 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                            {locIdx + 1}
                          </span>
                          {location}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {day.notes && (
                    <div className="bg-primary-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{day.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
