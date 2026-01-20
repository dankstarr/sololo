'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Heart, Bookmark, Eye, Headphones, MapPin, Calendar, Clock, User, Star, ArrowRight, Grid3x3, List, Sparkles } from 'lucide-react'
import { 
  Input, 
  Badge, 
  ScrollArea, 
  Card, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
} from '@/components/ui'
import { discoverItems as importedDiscoverItems, DiscoverItem } from '@/config/discover-items'
import { getImageUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import Footer from '@/components/marketing/Footer'
import { useDebounce } from '@/hooks'
import { trackedFetch } from '@/lib/utils/api/tracked-fetch'

type FilterType = 'all' | 'itinerary' | 'audio-guide' | 'route'

// Ensure discoverItems is available at module level
// Log at module level to debug import issues
console.log('🔍 Module level - importedDiscoverItems:', importedDiscoverItems?.length || 0, typeof importedDiscoverItems)

const discoverItems: DiscoverItem[] = (() => {
  if (Array.isArray(importedDiscoverItems) && importedDiscoverItems.length > 0) {
    console.log('✅ Using imported discoverItems:', importedDiscoverItems.length, 'items')
    return importedDiscoverItems
  }
  console.error('❌ importedDiscoverItems is empty or invalid, using fallback')
  // Fallback sample data if import fails
  return [
    {
      id: 'fallback-1',
      type: 'itinerary' as const,
      title: 'Sample Tokyo Itinerary',
      destination: 'Tokyo, Japan',
      duration: '5 days',
      description: 'A sample itinerary to test the discover page',
      likes: 100,
      saves: 50,
      views: 500,
      author: 'Sample Author',
      rating: 4.5,
      locations: 10,
    }
  ]
})()

export default function DiscoverPage() {
  const router = useRouter()
  const { 
    toggleSavedItinerary, 
    toggleSavedAudioGuide, 
    toggleSavedRoute,
    toggleLikedItinerary,
    toggleLikedAudioGuide,
    toggleLikedRoute,
    savedItineraries,
    savedAudioGuides,
    savedRoutes,
    likedItineraries,
    likedAudioGuides,
    likedRoutes,
    setCurrentTrip,
    setSelectedLocations,
    setItinerary,
  } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // 500ms debounce
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'featured'>('grid')
  const [sharedItineraries, setSharedItineraries] = useState<any[]>([])
  const [loadingShared, setLoadingShared] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch shared itineraries
  useEffect(() => {
    const fetchSharedItineraries = async () => {
      setLoadingShared(true)
      try {
        const response = await trackedFetch('/api/share/list')
        if (response.ok) {
          const data = await response.json()
          // Convert shared itineraries to DiscoverItem format
          const converted = data.map((item: any) => ({
            id: String(item.id),
            type: 'itinerary' as const,
            title: `${item.trip.destination} Itinerary`,
            destination: item.trip.destination,
            duration: `${item.trip.days} days`,
            likes: 0,
            saves: 0,
            views: item.views || 0,
            image: '/images/placeholder-location.jpg',
            shareId: item.id,
            isShared: true,
            description: 'Shared itinerary from the community',
          }))
          setSharedItineraries(converted)
        }
      } catch (error) {
        console.error('Error fetching shared itineraries:', error)
      } finally {
        setLoadingShared(false)
      }
    }

    fetchSharedItineraries()
  }, [])

  // Debug: Log discover items data
  useEffect(() => {
    console.log('=== DISCOVER PAGE DEBUG ===')
    console.log('discoverItems length:', discoverItems?.length || 0)
    console.log('discoverItems type:', typeof discoverItems)
    console.log('isArray:', Array.isArray(discoverItems))
    console.log('discoverItems:', discoverItems)
    console.log('importedDiscoverItems:', importedDiscoverItems)
    if (!discoverItems || discoverItems.length === 0) {
      console.error('❌ discoverItems is EMPTY!', {
        discoverItems,
        importedDiscoverItems,
        type: typeof discoverItems,
        isArray: Array.isArray(discoverItems)
      })
    } else {
      console.log('✅ discoverItems loaded successfully:', discoverItems.length, 'items')
    }
  }, [])

  // Filter items
  const filteredItems = useMemo(() => {
    // Ensure discoverItems is an array and has data
    if (!discoverItems || !Array.isArray(discoverItems) || discoverItems.length === 0) {
      console.error('❌ filteredItems: discoverItems is empty or not an array', { 
        discoverItems, 
        length: discoverItems?.length,
        isArray: Array.isArray(discoverItems),
        type: typeof discoverItems
      })
      return []
    }

    console.log('✅ Filtering items:', discoverItems.length, 'total items')
    console.log('🔍 Filter state:', { activeFilter, debouncedSearchQuery })

    // Combine discover items with shared itineraries
    const allItems = [...discoverItems, ...sharedItineraries]
    let filtered = [...allItems]

    // Apply type filter
    if (activeFilter !== 'all') {
      const beforeFilter = filtered.length
      filtered = filtered.filter(item => item.type === activeFilter)
      console.log(`🔍 Type filter "${activeFilter}": ${beforeFilter} → ${filtered.length} items`)
    }

    // Apply search filter (using debounced query to avoid spammy API calls)
    if (debouncedSearchQuery) {
      const beforeSearch = filtered.length
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          item.destination.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      console.log(`🔍 Search filter "${debouncedSearchQuery}": ${beforeSearch} → ${filtered.length} items`)
    }

    // Sort by popularity (views + likes)
    const sorted = filtered.sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
    console.log('✅ Filtered items result:', sorted.length, 'items')
    console.log('📦 First 3 items:', sorted.slice(0, 3).map(i => i.title))
    return sorted
  }, [debouncedSearchQuery, activeFilter, sharedItineraries])

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const ItemCard = ({ item }: { item: DiscoverItem }) => {
    const isSaved = item.type === 'itinerary' 
      ? savedItineraries.includes(item.id)
      : item.type === 'audio-guide'
      ? savedAudioGuides.includes(item.id)
      : savedRoutes.includes(item.id)

    const isLiked =
      item.type === 'itinerary'
        ? likedItineraries.includes(item.id)
        : item.type === 'audio-guide'
          ? likedAudioGuides.includes(item.id)
          : likedRoutes.includes(item.id)
    
    const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (item.type === 'itinerary') {
        toggleSavedItinerary(item.id)
      } else if (item.type === 'audio-guide') {
        toggleSavedAudioGuide(item.id)
      } else {
        toggleSavedRoute(item.id)
      }
    }

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (item.type === 'itinerary') {
        toggleLikedItinerary(item.id)
      } else if (item.type === 'audio-guide') {
        toggleLikedAudioGuide(item.id)
      } else {
        toggleLikedRoute(item.id)
      }
    }
    
    const handleClick = () => {
      // Check if this is a shared itinerary
      if ((item as any).isShared && (item as any).shareId) {
        router.push(`/discover/share/${(item as any).shareId}`)
        return
      }

      if (item.type === 'itinerary') {
        // Navigate to itinerary view
        router.push('/app/itinerary')
      } else if (item.type === 'audio-guide') {
        // Navigate to itinerary page (audio guides are part of itineraries)
        // In the future, this could navigate to a dedicated audio guide page
        router.push('/app/itinerary')
      } else {
        // Navigate to map with route
        router.push('/app/map')
      }
    }

    return (
      <div
        className="cursor-pointer scroll-fade-in"
        onClick={handleClick}
      >
        <Card className="card-modern tilt-card overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="relative">
            {/* Image */}
            <div className="w-full h-48 bg-gray-200 overflow-hidden relative">
              <Image
                src={getImageUrl(item.image, item.type === 'itinerary' ? 'trip' : 'discover')}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              
              {/* Type Badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge 
                  variant="default" 
                  className={`${
                    item.type === 'itinerary' 
                      ? 'bg-primary' 
                      : item.type === 'audio-guide' 
                      ? 'bg-primary-600' 
                      : 'bg-primary-500'
                  } text-white shadow-md`}
                >
                  {item.type === 'itinerary' ? '🗺️ Itinerary' : item.type === 'audio-guide' ? '🎧 Audio Guide' : '📍 Route'}
                </Badge>
                {(item as any).isShared && (
                  <Badge variant="default" className="bg-primary text-white">
                    ✨ Shared
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    isSaved ? 'bg-primary text-white' : 'bg-white/90 text-gray-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{item.destination}</span>
                <span>•</span>
                {item.type === 'audio-guide' ? (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>{item.audioLength || item.duration}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>{item.duration}</span>
                  </>
                )}
              </div>

              <p className="text-sm text-gray-700 line-clamp-2 mb-3">{item.description}</p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{formatNumber(item.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3" />
                    <span>{formatNumber(item.saves)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(item.views)}</span>
                  </div>
                </div>
                {item.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{item.rating}</span>
                  </div>
                )}
              </div>

              {/* Author & Locations */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                {item.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">{item.author}</span>
                  </div>
                )}
                {item.locations && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{item.locations} locations</span>
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="min-h-screen bg-background">
        {/* Page Header */}
        <header className="sticky top-20 z-20 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-5">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search itineraries, guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-primary" />}
                className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <Link
              href="/discover/locations"
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm whitespace-nowrap shadow-md"
            >
              Top Locations
            </Link>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
            <TabsList className="w-full sm:w-auto bg-secondary border border-primary/20 p-1 rounded-xl">
              <TabsTrigger 
                value="all"
                className={`rounded-lg transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-700 hover:bg-secondary/80'
                }`}
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="itinerary"
                className={`rounded-lg transition-all ${
                  activeFilter === 'itinerary' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-700 hover:bg-secondary/80'
                }`}
              >
                Itineraries
              </TabsTrigger>
              <TabsTrigger 
                value="audio-guide"
                className={`rounded-lg transition-all ${
                  activeFilter === 'audio-guide' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-700 hover:bg-secondary/80'
                }`}
              >
                Audio Guides
              </TabsTrigger>
              <TabsTrigger 
                value="route"
                className={`rounded-lg transition-all ${
                  activeFilter === 'route' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-700 hover:bg-secondary/80'
                }`}
              >
                Routes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 bg-background">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Discover Travel Content
            </h1>
            <p className="text-gray-600">
              Explore {filteredItems.length} {activeFilter === 'all' ? 'items' : activeFilter === 'itinerary' ? 'itineraries' : activeFilter === 'audio-guide' ? 'audio guides' : 'routes'}
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-1 border border-primary/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-secondary/80'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-secondary/80'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('featured')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'featured' ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-secondary/80'
              }`}
              aria-label="Featured view"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(() => {
          console.log('🎨 Rendering check - filteredItems.length:', filteredItems.length, 'viewMode:', viewMode, 'items:', filteredItems.slice(0, 2))
          return null
        })()}
        {filteredItems.length > 0 ? (
          <div className="w-full">
            {viewMode === 'featured' ? (
            // Featured View - Large hero card + smaller cards
            <div
              className="space-y-6 pb-6"
            >
              {filteredItems.length > 0 && (
                <>
                  {/* Featured Hero Card */}
                  <div
                    className="relative h-96 rounded-2xl overflow-hidden cursor-pointer group animate-fade-in-up"
                    onClick={() => {
                      const featured = filteredItems[0]
                      if (featured.type === 'itinerary') {
                        router.push('/app/itinerary')
                      } else if (featured.type === 'audio-guide') {
                        router.push('/app/itinerary')
                      } else {
                        router.push('/app/map')
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-600">
                      <Image
                        src={getImageUrl(filteredItems[0].image, filteredItems[0].type === 'itinerary' ? 'trip' : 'discover')}
                        alt={filteredItems[0].title}
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        sizes="100vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
                      <Badge className="w-fit mb-3 bg-primary text-white shadow-md">
                        ⭐ Featured
                      </Badge>
                      <h2 className="text-3xl font-bold text-white mb-2">{filteredItems[0].title}</h2>
                      <p className="text-white/90 mb-4 line-clamp-2">{filteredItems[0].description}</p>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{filteredItems[0].destination}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{formatNumber(filteredItems[0].likes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{filteredItems[0].rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid of remaining items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredItems.slice(1).map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : viewMode === 'list' ? (
            // List View - Horizontal cards
            <div
              className="space-y-4 pb-6"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="cursor-pointer scroll-slide-right"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => {
                      if (item.type === 'itinerary') {
                        router.push('/app/itinerary')
                      } else if (item.type === 'audio-guide') {
                        router.push('/app/itinerary')
                      } else {
                        router.push('/app/map')
                      }
                    }}
                  >
                    <Card className="card-modern overflow-hidden rounded-2xl">
                      <div className="flex gap-4 p-5">
                        {/* Image */}
                        <div className="w-32 h-32 rounded-xl bg-secondary flex-shrink-0 overflow-hidden relative">
                          <Image
                            src={getImageUrl(item.image, item.type === 'itinerary' ? 'trip' : 'discover')}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge 
                              variant="default" 
                              className={`${
                                item.type === 'itinerary' 
                                  ? 'bg-primary' 
                                  : item.type === 'audio-guide' 
                                  ? 'bg-primary-600' 
                                  : 'bg-primary-500'
                              } text-white text-xs shadow-md`}
                            >
                              {item.type === 'itinerary' ? '🗺️' : item.type === 'audio-guide' ? '🎧' : '📍'}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{item.destination}</span>
                            <span>•</span>
                            {item.type === 'audio-guide' ? (
                              <>
                                <Headphones className="w-4 h-4" />
                                <span>{item.audioLength || item.duration}</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4" />
                                <span>{item.duration}</span>
                              </>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">{item.description}</p>

                          {/* Stats */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{formatNumber(item.likes)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bookmark className="w-3 h-3" />
                                <span>{formatNumber(item.saves)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatNumber(item.views)}</span>
                              </div>
                            </div>
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm">{item.rating}</span>
                              </div>
                            )}
                            <ArrowRight className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No items found</p>
                  <p className="text-gray-500 text-sm">Try a different search or filter.</p>
                </div>
              )}
            </div>
          ) : (
            // Grid View - Default
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-6"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No items found</p>
                  <p className="text-gray-500 text-sm">Try a different search or filter.</p>
                </div>
              )}
            </div>
          )}
          </div>
        ) : (
          <Card className="text-center py-16 min-h-[400px] flex flex-col items-center justify-center bg-secondary/20">
            <Sparkles className="w-16 h-16 text-primary/40 mb-4" />
            <p className="text-gray-900 text-lg font-semibold mb-2">No items found</p>
            <p className="text-gray-600 text-sm mb-6 max-w-md">
              {!discoverItems || discoverItems.length === 0
                ? 'No discover items available. Please check the data source.'
                : `Try changing the filter or search. Found ${discoverItems.length} total items.`}
            </p>
            <button
              onClick={() => {
                setActiveFilter('all')
                setSearchQuery('')
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 hover-lift hover-glow shadow-md"
            >
              Show All Items
            </button>
          </Card>
        )}
      </div>
      </div>
      <Footer />
    </main>
  )
}
