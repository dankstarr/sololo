'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { User, MapPin, Calendar, Heart, Bookmark, Route, ArrowLeft, Sparkles, Map, MoreVertical, Share2, Trash2, Copy, Link as LinkIcon, Settings, Edit, Lock, Bell, Shield, Download, LogOut, Mail, Key, Globe, Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button, Card, Badge, ScrollArea, Input, Textarea } from '@/components/ui'
import { discoverItems } from '@/config/discover-items'
import {
  syncUserProfileFromDB,
  syncSavedItemsFromDB,
  syncSavedLocationsFromDB,
  syncUserTripsFromDB,
  updateUserProfileInDB,
} from '@/lib/utils/user'
import { useAuth } from '@/hooks'

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
    updateUserProfile,
    setSavedItineraries,
    setSavedAudioGuides,
    setSavedRoutes,
    setLikedItineraries,
    setLikedAudioGuides,
    setLikedRoutes,
    toggleSavedItinerary,
    toggleLikedItinerary,
    setSelectedLocations,
  } = useAppStore()

  const [sharedItineraries, setSharedItineraries] = useState<any[]>([])
  const [savedLocations, setSavedLocations] = useState<any[]>([])
  const [userTrips, setUserTrips] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: userProfile.name,
    email: userProfile.email,
    bio: userProfile.bio || '',
    homeBase: userProfile.homeBase || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    tripReminders: true,
    newFeatures: true,
  })
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    allowSharing: true,
  })
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()

  // Sync all data from DB on mount
  useEffect(() => {
    const syncData = async () => {
      setIsLoading(true)
      try {
        const userId = userProfile.id || 'user-1'
        
        // Sync user profile
        await syncUserProfileFromDB(userId, updateUserProfile)
        
        // Sync saved items
        await syncSavedItemsFromDB(userId, {
          setSavedItineraries,
          setSavedAudioGuides,
          setSavedRoutes,
          setLikedItineraries,
          setLikedAudioGuides,
          setLikedRoutes,
        })
        
        // Sync saved locations
        const locations = await syncSavedLocationsFromDB(userId)
        setSavedLocations(locations)
        
        // Sync user trips
        const trips = await syncUserTripsFromDB(userId)
        setUserTrips(trips)
        
        // Load shared itineraries
        const res = await fetch('/api/share/list')
        if (res.ok) {
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
        }
      } catch (e) {
        console.warn('Failed to sync profile data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    
    syncData()
  }, [userProfile.id, updateUserProfile, setSavedItineraries, setSavedAudioGuides, setSavedRoutes, setLikedItineraries, setLikedAudioGuides, setLikedRoutes])

  const allDiscoverItems = useMemo(() => {
    return [...discoverItems, ...sharedItineraries]
  }, [sharedItineraries])

  // Convert user trips to discover item format for unified display
  const userTripsAsItems = useMemo(() => {
    return userTrips.map((trip) => ({
      id: `trip-${trip.id}`,
      type: 'itinerary' as const,
      title: `${trip.destination} Trip`,
      destination: trip.destination,
      duration: `${trip.days} days`,
      description: `Trip to ${trip.destination}`,
      isUserTrip: true,
      tripData: trip,
    }))
  }, [userTrips])

  // Combine all saved trips: from discover items + saved user trips
  const allSavedTrips = useMemo(() => {
    const savedDiscoverTrips = allDiscoverItems.filter(
      (item) => item.type === 'itinerary' && savedItineraries.includes(item.id)
    )
    const savedUserTrips = userTripsAsItems.filter((item) =>
      savedItineraries.includes(item.id)
    )
    return [...savedDiscoverTrips, ...savedUserTrips]
  }, [allDiscoverItems, savedItineraries, userTripsAsItems])

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

  const openUserTrip = (trip: any) => {
    const tripData = {
      destination: trip.destination,
      days: String(trip.days),
      dates: {
        start: trip.startDate || new Date().toISOString().split('T')[0],
        end: trip.endDate || new Date(Date.now() + trip.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      interests: trip.interests || [],
      travelMode: trip.travelMode || 'walking',
      pace: trip.pace || 'balanced',
      accessibility: trip.accessibility || false,
    }
    setCurrentTrip(tripData)
    setItinerary(trip.itinerary || [])
    router.push('/app/itinerary')
  }

  const openSavedLocation = (location: any) => {
    router.push(`/discover/locations?location=${encodeURIComponent(location.name || location.id)}`)
  }

  const handleSaveTrip = (tripId: string) => {
    toggleSavedItinerary(tripId)
  }

  const handleSaveUserTrip = (trip: any) => {
    const tripId = `trip-${trip.id}`
    handleSaveTrip(tripId)
  }

  const handleSaveSharedTrip = (shareId: string) => {
    handleSaveTrip(shareId)
  }

  const handleLikeTrip = (tripId: string) => {
    toggleLikedItinerary(tripId)
  }

  const handleShareTrip = async (trip: any, isUserTrip: boolean = false) => {
    try {
      let tripData, locations, itinerary
      
      if (isUserTrip) {
        tripData = {
          destination: trip.destination,
          days: trip.days,
          dates: {
            start: trip.startDate || new Date().toISOString().split('T')[0],
            end: trip.endDate || new Date(Date.now() + trip.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          interests: trip.interests || [],
          travelMode: trip.travelMode || 'walking',
          pace: trip.pace || 'balanced',
          accessibility: trip.accessibility || false,
        }
        locations = trip.locations || []
        itinerary = trip.itinerary || []
      } else {
        // For discover items, create a basic trip structure
        const daysFromDuration = parseInt(trip.duration) || 3
        tripData = {
          destination: trip.destination,
          days: String(daysFromDuration),
          dates: {
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + daysFromDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          interests: [],
          travelMode: 'walking',
          pace: 'balanced',
          accessibility: false,
        }
        locations = []
        itinerary = Array.from({ length: daysFromDuration }).map((_, idx) => ({
          id: String(idx + 1),
          day: idx + 1,
          locations: [trip.title],
          estimatedTime: '4-6 hours',
          distance: '3.0 km',
          pace: 'balanced' as const,
          notes: '',
          budget: '$50-100',
        }))
      }

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip: tripData,
          locations,
          itinerary,
        }),
      })

      if (!res.ok) throw new Error('Failed to share trip')
      
      const data = await res.json()
      const fullUrl = `${window.location.origin}${data.shareUrl}`
      setShareUrl(fullUrl)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl)
      alert('Share link copied to clipboard!')
      
      setOpenMenuId(null)
    } catch (e) {
      console.error('Failed to share trip:', e)
      alert('Failed to share trip. Please try again.')
    }
  }

  const handleCopyLink = async (shareId: string) => {
    const fullUrl = `${window.location.origin}/discover/share/${shareId}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      alert('Link copied to clipboard!')
      setOpenMenuId(null)
    } catch (e) {
      console.error('Failed to copy link:', e)
      alert('Failed to copy link')
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/trips?id=${tripId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete trip')

      // Refresh trips list
      const trips = await syncUserTripsFromDB(userProfile.id || 'user-1')
      setUserTrips(trips)
      
      alert('Trip deleted successfully')
      setOpenMenuId(null)
    } catch (e) {
      console.error('Failed to delete trip:', e)
      alert('Failed to delete trip. Please try again.')
    }
  }

  const handleDuplicateTrip = async (trip: any) => {
    try {
      const newTrip = {
        destination: trip.destination,
        days: trip.days,
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + trip.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        interests: trip.interests || [],
        travelMode: trip.travelMode || 'walking',
        pace: trip.pace || 'balanced',
        accessibility: trip.accessibility || false,
      }

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id || 'user-1',
          trip: newTrip,
          locations: trip.locations || [],
          itinerary: trip.itinerary || [],
        }),
      })

      if (!res.ok) throw new Error('Failed to duplicate trip')

      // Refresh trips list
      const trips = await syncUserTripsFromDB(userProfile.id || 'user-1')
      setUserTrips(trips)
      
      alert('Trip duplicated successfully')
      setOpenMenuId(null)
    } catch (e) {
      console.error('Failed to duplicate trip:', e)
      alert('Failed to duplicate trip. Please try again.')
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  // Update profile form when userProfile changes
  useEffect(() => {
    setProfileForm({
      name: userProfile.name,
      email: userProfile.email,
      bio: userProfile.bio || '',
      homeBase: userProfile.homeBase || '',
    })
  }, [userProfile])

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(profileForm)
      await updateUserProfileInDB(userProfile.id, profileForm)
      setEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (e) {
      console.error('Failed to update profile:', e)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) throw error

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('Password updated successfully!')
    } catch (e: any) {
      console.error('Failed to change password:', e)
      alert(e.message || 'Failed to change password. Please try again.')
    }
  }

  const handleExportData = async () => {
    try {
      const userId = userProfile.id || 'user-1'
      const [trips, savedItems, locations] = await Promise.all([
        syncUserTripsFromDB(userId),
        fetch(`/api/users/saved-items?userId=${userId}`).then(r => r.json()),
        syncSavedLocationsFromDB(userId),
      ])

      const exportData = {
        profile: userProfile,
        trips,
        savedItems,
        savedLocations: locations,
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sololo-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('Data exported successfully!')
    } catch (e) {
      console.error('Failed to export data:', e)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return
    }

    if (!confirm('This will permanently delete ALL your trips, saved items, and account data. Type DELETE to confirm.')) {
      return
    }

    try {
      // Delete user data from database
      const userId = userProfile.id || 'user-1'
      const res = await fetch(`/api/users/profile?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete account data')

      // Sign out
      await signOut()
      
      alert('Account deleted successfully')
      router.push('/app/home')
    } catch (e) {
      console.error('Failed to delete account:', e)
      alert('Failed to delete account. Please try again.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error('Failed to sign in with Google:', e)
      alert('Failed to sign in with Google. Please try again.')
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? You will need to sign in with email/password.')) {
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase/client')
      // Note: Supabase doesn't have a direct "unlink" method
      // User would need to change their password or contact support
      alert('To disconnect Google, please change your password or contact support.')
    } catch (e) {
      console.error('Failed to disconnect Google:', e)
    }
  }

  if (isLoading) {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Quick Navigation */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/app/home" className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Home
          </Link>
          <Link href="/app/itinerary" className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Itinerary
          </Link>
          <Link href="/app/map" className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Map
          </Link>
          <Link href="/app/groups" className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Groups
          </Link>
          <Link href="/discover" className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Discover
          </Link>
        </div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/app/home')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trip Planner
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant={showSettings ? 'primary' : 'outline'}
              size="small"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={showSettings ? 'primary' : 'outline'}
              size="small"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
          <Badge className="bg-primary text-white flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Profile
          </Badge>
          </div>
        </div>
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
                  <span className="font-semibold">{userTrips.length || userProfile.tripsCreated || itineraryCount}</span>
                </span>
                <span>
                  Saved:{' '}
                  <span className="font-semibold">
                    {allSavedTrips.length || 0}
                  </span>
                </span>
                <span>
                  Favorites:{' '}
                  <span className="font-semibold">
                    {lovedTrips.length +
                        favoriteRoutes.length +
                      favoriteGuides.length ||
                      userProfile.favoritesCount ||
                      0}
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
            {/* My Trips */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Route className="w-4 h-4 text-primary" />
                  My Trips
                </h2>
                <span className="text-xs text-gray-500">
                  {userTrips.length} trips
                </span>
              </div>
              {userTrips.length > 0 ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 pr-2">
                    {userTrips.map((trip) => {
                      const tripId = `trip-${trip.id}`
                      const isSaved = savedItineraries.includes(tripId)
                      const isLiked = likedItineraries.includes(tripId)
                      const menuId = `menu-${trip.id}`
                      const isMenuOpen = openMenuId === menuId
                      
                      return (
                        <Card key={trip.id} className="p-3 flex items-center justify-between gap-2 relative">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {trip.destination}
                            </p>
                            <p className="text-xs text-gray-600">
                              {trip.days} days • {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'No dates'}
                              {trip.interests?.length > 0 && (
                                <span className="ml-2">
                                  • {trip.interests.slice(0, 2).join(', ')}
                                  {trip.interests.length > 2 && '...'}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isSaved ? 'primary' : 'outline'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveUserTrip(trip)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant={isLiked ? 'primary' : 'outline'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLikeTrip(tripId)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            </Button>
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(isMenuOpen ? null : menuId)
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleShareTrip(trip, true)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Share Trip
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicateTrip(trip)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openUserTrip(trip)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Route className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteTrip(trip.id)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Trip
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-600">
                  You haven&apos;t created any trips yet. Start planning your first trip!
                </p>
              )}
            </Card>

            {/* Saved trips - All saved trips (discover + user trips) */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  Saved Trips
                </h2>
                <span className="text-xs text-gray-500">
                  {allSavedTrips.length} saved
                </span>
              </div>
              {allSavedTrips.length > 0 ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 pr-2">
                    {allSavedTrips.map((item) => {
                      const isUserTrip = 'isUserTrip' in item && item.isUserTrip
                      const isLiked = likedItineraries.includes(item.id)
                      const menuId = `saved-${item.id}`
                      const isMenuOpen = openMenuId === menuId
                      
                      return (
                        <Card key={item.id} className="p-3 flex items-center justify-between gap-2 relative">
                          <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.destination} • {item.duration}
                              {isUserTrip && <span className="ml-2 text-primary">• My Trip</span>}
                          </p>
                        </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isLiked ? 'primary' : 'outline'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLikeTrip(item.id)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            </Button>
                            <div className="relative">
                        <Button
                          variant="outline"
                          size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(isMenuOpen ? null : menuId)
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isUserTrip && 'tripData' in item) {
                                        handleShareTrip(item.tripData, true)
                                      } else {
                                        handleShareTrip(item, false)
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Share Trip
                                  </button>
                                  {item.shareId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCopyLink(item.shareId)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                      Copy Link
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveTrip(item.id)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Bookmark className="w-4 h-4 fill-current" />
                                    Unsave
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isUserTrip && 'tripData' in item) {
                                        openUserTrip(item.tripData)
                                      } else {
                                        openSavedTrip(item)
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Route className="w-4 h-4" />
                                    View Details
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-600">
                  You haven&apos;t saved any trips yet. Save trips from &quot;My Trips&quot; or explore and save itineraries from the discover page.
                </p>
              )}
            </Card>

            {/* Saved Locations */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Map className="w-4 h-4 text-primary" />
                  Saved Locations
                </h2>
                <span className="text-xs text-gray-500">
                  {savedLocations.length} locations
                </span>
              </div>
              {savedLocations.length > 0 ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3 pr-2">
                    {savedLocations.map((location) => (
                      <Card key={location.id} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {location.name || location.title || 'Unnamed Location'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {location.category && `${location.category} • `}
                            {location.destination || location.address || 'Location'}
                            {location.rating && ` • ⭐ ${location.rating}`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => openSavedLocation(location)}
                        >
                          View
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-600">
                  You haven&apos;t saved any locations yet. Save locations from the discover page to see them here.
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
                    {lovedTrips.map((item) => {
                      const isSaved = savedItineraries.includes(item.id)
                      const menuId = `fav-${item.id}`
                      const isMenuOpen = openMenuId === menuId
                      
                      return (
                        <Card key={item.id} className="p-3 flex items-center justify-between gap-2 relative">
                          <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600">
                            Itinerary • {item.destination} • {item.duration}
                          </p>
                        </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isSaved ? 'primary' : 'outline'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveTrip(item.id)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                            </Button>
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(isMenuOpen ? null : menuId)
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                        </Button>
                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleLikeTrip(item.id)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Heart className="w-4 h-4 fill-current" />
                                    Remove from Favorites
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleShareTrip(item, false)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Share Trip
                                  </button>
                                  {item.shareId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCopyLink(item.shareId)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                      Copy Link
                                    </button>
                                  )}
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openLovedTrip(item)
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Route className="w-4 h-4" />
                                    View Details
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                      </Card>
                      )
                    })}
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

        {/* Settings Section */}
        {showSettings && (
          <div className="mt-8 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Profile Settings
              </h2>

              {/* Profile Information */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile Information
                    </h3>
                    {!editingProfile && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  {editingProfile ? (
                    <div className="space-y-4">
                      <Input
                        label="Name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        disabled={!!(isAuthenticated && user?.email)}
                        helperText={isAuthenticated && user?.email ? 'Email is managed by your authentication provider' : ''}
                      />
                      <Input
                        label="Home Base"
                        value={profileForm.homeBase}
                        onChange={(e) => setProfileForm({ ...profileForm, homeBase: e.target.value })}
                        placeholder="e.g., London, UK"
                        icon={<MapPin className="w-4 h-4" />}
                      />
                      <Textarea
                        label="Bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} variant="primary">
                          Save Changes
                        </Button>
                        <Button onClick={() => {
                          setEditingProfile(false)
                          setProfileForm({
                            name: userProfile.name,
                            email: userProfile.email,
                            bio: userProfile.bio || '',
                            homeBase: userProfile.homeBase || '',
                          })
                        }} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-semibold">Name:</span> {userProfile.name}</p>
                      <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
                      {userProfile.homeBase && (
                        <p><span className="font-semibold">Home Base:</span> {userProfile.homeBase}</p>
                      )}
                      {userProfile.bio && (
                        <p><span className="font-semibold">Bio:</span> {userProfile.bio}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Account Security */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Account Security
                  </h3>
                  
                  {/* Google Sign-In */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Google Sign-In</p>
                        <p className="text-sm text-gray-600">
                          {isAuthenticated && user?.app_metadata?.provider === 'google' 
                            ? 'Connected to Google account' 
                            : 'Sign in with your Google account'}
                        </p>
                      </div>
                      {isAuthenticated && user?.app_metadata?.provider === 'google' ? (
                        <Button variant="outline" size="small" onClick={handleDisconnectGoogle}>
                          Disconnect
                        </Button>
                      ) : (
                        <Button variant="primary" size="small" onClick={handleGoogleSignIn}>
                          Connect Google
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Password Management */}
                  {(!isAuthenticated || user?.app_metadata?.provider !== 'google') && (
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Change Password</p>
                        <div className="space-y-3">
                          <Input
                            label="Current Password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            icon={<Key className="w-4 h-4" />}
                          />
                          <Input
                            label="New Password"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            icon={<Key className="w-4 h-4" />}
                            helperText="Must be at least 6 characters"
                          />
                          <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            icon={<Key className="w-4 h-4" />}
                          />
                          <Button onClick={handleChangePassword} variant="primary" size="small">
                            Update Password
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notification Preferences */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">Email Notifications</span>
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">Push Notifications</span>
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">Trip Reminders</span>
                      <input
                        type="checkbox"
                        checked={notifications.tripReminders}
                        onChange={(e) => setNotifications({ ...notifications, tripReminders: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">New Features & Updates</span>
                      <input
                        type="checkbox"
                        checked={notifications.newFeatures}
                        onChange={(e) => setNotifications({ ...notifications, newFeatures: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy Settings
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Visibility</label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">Show Email Address</span>
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-700">Allow Trip Sharing</span>
                      <input
                        type="checkbox"
                        checked={privacy.allowSharing}
                        onChange={(e) => setPrivacy({ ...privacy, allowSharing: e.target.checked })}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Account Management */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Account Management
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Export Your Data</p>
                        <p className="text-sm text-gray-600">Download all your trips, saved items, and profile data</p>
                      </div>
                      <Button variant="outline" size="small" onClick={handleExportData} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Data
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Sign Out</p>
                        <p className="text-sm text-gray-600">Sign out of your account</p>
                      </div>
                      <Button variant="outline" size="small" onClick={signOut} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="font-semibold text-red-600">Delete Account</p>
                        <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="outline" size="small" onClick={handleDeleteAccount} className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

