'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, Star, Filter, X, ArrowLeft, Home, Map, Calendar, Compass } from 'lucide-react'
import { Input, Badge, ScrollArea, Card, Slider, ToggleGroup, ToggleGroupItem, Drawer, DrawerContent, Button } from '@/components/ui'
import { londonLocations, NearbyLocation } from '@/config/nearby-locations'
import { getImageUrl } from '@/lib/utils'
import Image from 'next/image'

type FilterType = 'all' | 'best' | 'top-rated' | 'hidden-gems'
type SortType = 'distance' | 'rating' | 'reviews'

export default function NearbyDiscovery() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState([5])
  const [minReviews, setMinReviews] = useState(['100'])
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = [...londonLocations]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filters
    if (activeFilter === 'best') {
      filtered = filtered.filter((loc) => loc.rating >= 4.7)
    } else if (activeFilter === 'top-rated') {
      filtered = filtered.sort((a, b) => b.rating - a.rating)
    } else if (activeFilter === 'hidden-gems') {
      filtered = filtered.filter((loc) => loc.reviewCount < 5000 && loc.rating >= 4.5)
    }

    // Apply review count filter
    const minReviewCount = parseInt(minReviews[0] || '0')
    filtered = filtered.filter((loc) => loc.reviewCount >= minReviewCount)

    // Sort by distance (simulated)
    return filtered.sort((a, b) => {
      const distA = parseFloat(a.distance.replace(' km', ''))
      const distB = parseFloat(b.distance.replace(' km', ''))
      return distA - distB
    })
  }, [searchQuery, activeFilter, minReviews])

  const LocationCard = ({ location, index }: { location: NearbyLocation; index: number }) => {
    const isHighRated = location.rating > 4.7

    return (
      <div
        className="cursor-pointer hover:scale-[1.02] transition-transform duration-200 scroll-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => setSelectedLocation(location.id)}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all">
          <div className="flex gap-4 p-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                #{index + 1}
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="w-20 h-20 rounded-xl bg-secondary flex-shrink-0 overflow-hidden relative">
              <Image
                src={getImageUrl(location.image, 'location')}
                alt={location.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{location.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{location.category}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">{location.rating}</span>
                </div>
                {isHighRated && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    ⭐ Top Rated
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  ({location.reviewCount.toLocaleString()} reviews)
                </span>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{location.distance} away</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const DesktopLayout = () => (
    <div className="h-screen flex">
      {/* Left Sidebar - 40% */}
      <div className="w-[40%] flex flex-col border-r border-border bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-4">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <Link href="/app/home" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Home">
                <Home className="w-4 h-4" />
              </Link>
              <Link href="/app/itinerary" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Itinerary">
                <Calendar className="w-4 h-4" />
              </Link>
              <Link href="/app/map" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Map">
                <Map className="w-4 h-4" />
              </Link>
              <Link href="/discover" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Discover">
                <Compass className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <Input
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="rounded-3xl"
          />

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['all', 'best', 'top-rated', 'hidden-gems'] as FilterType[]).map((filter) => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter === 'best' ? '🔥 Best' : filter === 'top-rated' ? '🏆 Top Rated' : '💎 Hidden Gems'}
              </Badge>
            ))}
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search Radius: {searchRadius[0]} km
              </label>
              <Slider
                value={searchRadius}
                onValueChange={setSearchRadius}
                min={1}
                max={10}
                step={0.5}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Minimum Reviews
              </label>
              <ToggleGroup
                type="single"
                value={minReviews[0]}
                onValueChange={(value) =>
                  setMinReviews([(typeof value === 'string' ? value : value[0]) || '0'])
                }
              >
                <ToggleGroupItem value="0">Any</ToggleGroupItem>
                <ToggleGroupItem value="100">100+</ToggleGroupItem>
                <ToggleGroupItem value="1000">1K+</ToggleGroupItem>
                <ToggleGroupItem value="5000">5K+</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {filteredLocations.map((location, index) => (
              <LocationCard key={location.id} location={location} index={index} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Map - 60% */}
      <div className="flex-1 bg-secondary relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Mapbox Map</p>
            <p className="text-sm">Map integration placeholder</p>
          </div>
        </div>
      </div>
    </div>
  )

  const MobileLayout = () => (
    <div className="h-screen flex flex-col">
      {/* Map - Top */}
      <div className="flex-1 bg-secondary relative">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Mapbox Map</p>
          </div>
        </div>
        
        {/* Floating Search Button */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="absolute bottom-4 left-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-3xl font-semibold shadow-lg flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Search & Filter
        </button>
      </div>

      {/* Bottom Sheet Drawer */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} side="bottom">
        <DrawerContent onClose={() => setMobileDrawerOpen(false)}>
          <div className="space-y-4">
            <Input
              placeholder="Search cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="rounded-3xl"
            />

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(['all', 'best', 'top-rated', 'hidden-gems'] as FilterType[]).map((filter) => (
                <Badge
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === 'all' ? 'All' : filter === 'best' ? '🔥 Best' : filter === 'top-rated' ? '🏆 Top Rated' : '💎 Hidden Gems'}
                </Badge>
              ))}
            </div>

            {/* Controls */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Search Radius: {searchRadius[0]} km
                </label>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minimum Reviews
                </label>
                <ToggleGroup
                  type="single"
                  value={minReviews[0]}
                  onValueChange={(value) =>
                    setMinReviews([(typeof value === 'string' ? value : value[0]) || '0'])
                  }
                >
                  <ToggleGroupItem value="0">Any</ToggleGroupItem>
                  <ToggleGroupItem value="100">100+</ToggleGroupItem>
                  <ToggleGroupItem value="1000">1K+</ToggleGroupItem>
                  <ToggleGroupItem value="5000">5K+</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Location List */}
            <ScrollArea className="max-h-[60vh] -mx-6 px-6">
              <div className="space-y-3 pb-4">
                {filteredLocations.map((location, index) => (
                  <LocationCard key={location.id} location={location} index={index} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )

  return (
    <div className="h-screen overflow-hidden">
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  )
}
