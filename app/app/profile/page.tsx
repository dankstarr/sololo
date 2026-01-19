'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { User, MapPin, Calendar, Heart, Bookmark, Route, ArrowLeft, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button, Card, Badge, ScrollArea } from '@/components/ui'
import { discoverItems } from '@/config/discover-items'

export default function ProfilePage() {
  const router = useRouter()
  const {
    userProfile,
    currentTrip,
    itineraryCount,
    savedItineraries,
    savedAudioGuides,
    savedRoutes,
    likedItineraries,
    likedAudioGuides,
    likedRoutes,
    setCurrentTrip,
    setItinerary,
  } = useAppStore()

  const [sharedItineraries, setSharedItineraries] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/share/list')
        if (!res.ok) return
        const data = await res.json()
        const converted = (data || []).map((item: any) => ({
          id: String(item.id),
          type: 'itinerary' as const,
          title: `${item.trip.destination} Itinerary`,
          destination: item.trip.destination,
          duration: `${item.trip.days} days`,
          description: 'Shared itinerary from the community',
          likes: 0,
          saves: 0,
          views: item.views || 0,
          shareId: item.id,
          isShared: true,
        }))
        setSharedItineraries(converted)
      } catch (e) {
        console.warn('Failed to load shared itineraries on profile:', e)
      }
    })()
  }, [])

  const allDiscoverItems = useMemo(() => {
    return [...discoverItems, ...sharedItineraries]
  }, [sharedItineraries])

  const favoriteTrips = useMemo(
    () => allDiscoverItems.filter((item) => item.type === 'itinerary' && savedItineraries.includes(item.id)),
    [allDiscoverItems, savedItineraries]
  )

  const favoriteRoutes = useMemo(
    () => allDiscoverItems.filter((item) => item.type === 'route' && likedRoutes.includes(item.id)),
    [allDiscoverItems, likedRoutes]
  )

  const favoriteGuides = useMemo(
    () => allDiscoverItems.filter((item) => item.type === 'audio-guide' && likedAudioGuides.includes(item.id)),
    [allDiscoverItems, likedAudioGuides]
  )

  const lovedTrips = useMemo(
    () => allDiscoverItems.filter((item) => item.type === 'itinerary' && likedItineraries.includes(item.id)),
    [allDiscoverItems, likedItineraries]
  )

  const openSavedTrip = (item: (typeof discoverItems)[number]) => {
    // Seed a simple trip and itinerary based on the saved discover item
    const daysFromDuration =
      parseInt(item.duration) || 3

    const trip = {
      destination: item.destination,
      days: String(daysFromDuration),
      dates: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + daysFromDuration * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
      interests: [],
      travelMode: 'walking' as const,
      pace: 'balanced' as const,
      accessibility: false,
    }

    const itineraryDays = Array.from({ length: daysFromDuration }).map((_, idx) => ({
      id: String(idx + 1),
      day: idx + 1,
      locations: [item.title],
      estimatedTime: '4-6 hours',
      distance: '3.0 km',
      pace: 'balanced' as const,
      notes: '',
      budget: '$50-100',
    }))

    setCurrentTrip(trip)
    setItinerary(itineraryDays)
    router.push('/app/itinerary')
  }

  const openLovedTrip = (item: any) => {
    if (item?.isShared && item?.shareId) {
      router.push(`/discover/share/${item.shareId}`)
      return
    }
    router.push('/discover')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/app/home')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trip Planner
          </button>
          <Badge className="bg-primary text-white flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Profile
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column – profile card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-secondary">
                {userProfile.avatarUrl ? (
                  <Image
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{userProfile.name}</h1>
              <p className="text-sm text-gray-600 mb-2">{userProfile.email}</p>
              {userProfile.homeBase && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3" />
                  {userProfile.homeBase}
                </p>
              )}
              {userProfile.bio && (
                <p className="text-sm text-gray-700 mb-4">{userProfile.bio}</p>
              )}
              <div className="flex gap-3 text-xs text-gray-600">
                <span>
                  Trips created:{' '}
                  <span className="font-semibold">{userProfile.tripsCreated || itineraryCount}</span>
                </span>
                <span>
                  Favorites:{' '}
                  <span className="font-semibold">
                    {userProfile.favoritesCount ||
                      favoriteTrips.length +
                        favoriteRoutes.length +
                        favoriteGuides.length}
                  </span>
                </span>
              </div>
            </Card>

            {/* Current trip summary */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Current Trip
              </h2>
              {currentTrip ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold">{currentTrip.destination}</p>
                  <p>
                    {currentTrip.days} days •{' '}
                    {currentTrip.dates.start} → {currentTrip.dates.end}
                  </p>
                  {currentTrip.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentTrip.interests.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => router.push('/app/itinerary')}
                  >
                    View Itinerary
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No active trip yet. Start by planning a trip on the home screen.
                  <Button
                    variant="primary"
                    className="mt-3 w-full"
                    onClick={() => router.push('/app/home')}
                  >
                    Plan a Trip
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right column – saved & favorites */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved trips */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  Saved Trips
                </h2>
                <span className="text-xs text-gray-500">
                  {favoriteTrips.length} saved
                </span>
              </div>
              {favoriteTrips.length > 0 ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 pr-2">
                    {favoriteTrips.map((item) => (
                      <Card key={item.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.destination} • {item.duration}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => openSavedTrip(item)}
                        >
                          Open
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-600">
                  You haven’t saved any trips yet. Explore and save itineraries to see them here.
                </p>
              )}
            </Card>

            {/* Favorites */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Favorites
                </h2>
                <span className="text-xs text-gray-500">
                  {lovedTrips.length + favoriteGuides.length + favoriteRoutes.length} favorites
                </span>
              </div>
              {lovedTrips.length + favoriteGuides.length + favoriteRoutes.length > 0 ? (
                <ScrollArea className="max-h-72">
                  <div className="space-y-3 pr-2">
                    {lovedTrips.map((item) => (
                      <Card key={item.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600">
                            Itinerary • {item.destination} • {item.duration}
                          </p>
                        </div>
                        <Button variant="outline" size="small" onClick={() => openLovedTrip(item)}>
                          View
                        </Button>
                      </Card>
                    ))}
                    {favoriteGuides.map((item) => (
                      <Card key={item.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            Audio Guide • {item.destination}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => router.push('/discover')}
                        >
                          View
                        </Button>
                      </Card>
                    ))}
                    {favoriteRoutes.map((item) => (
                      <Card key={item.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            Route • {item.destination}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => router.push('/app/map')}
                        >
                          View on Map
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-600">
                  You haven’t added any favorites yet. Heart trips, routes, and guides to see them here.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

