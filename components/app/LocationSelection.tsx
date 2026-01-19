'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { m, Reorder } from 'framer-motion'
import Image from 'next/image'
import {
  Check,
  X,
  GripVertical,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { sampleLocations } from '@/config/sample-data'
import { generateAlternativeLocation as generateAlt, getImageUrl } from '@/lib/utils'
import { generateLocationExplanation, generateAlternativeLocation, generateLocationSuggestions, generateLocationsWithExplanations } from '@/lib/api/gemini'
import { searchPlaces, geocodeAddress } from '@/lib/api/google-maps'
import { Location } from '@/types'
import { AIReasoningPanel } from '@/components/common'
import { useAIReasoning } from '@/hooks'
import { useAppStore } from '@/store/useAppStore'

interface LocationWithIncluded extends Location {
  included: boolean
}

export default function LocationSelection() {
  const router = useRouter()
  const { currentTrip, setSelectedLocations, setItinerary } = useAppStore()
  const [locations, setLocations] = useState<LocationWithIncluded[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const reasoning = useAIReasoning()
  
  // Get destination from trip or default
  const destination = currentTrip?.destination || 'Tokyo, Japan'
  const days = currentTrip?.days ? parseInt(currentTrip.days) : 5
  const interests = currentTrip?.interests || []

  const toggleLocation = (id: string) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id ? { ...loc, included: !loc.included } : loc
      )
    )
  }

  const handleReplace = async (id: string) => {
    const location = locations.find((loc) => loc.id === id)
    if (!location) return
    
    setGenerating(id)
    reasoning.reset()
    
    try {
      // Step 1: Analyze current location
      const step1Id = reasoning.addStep({
        id: `replace-${id}-1`,
        title: 'Analyzing current location',
        description: `Understanding ${location.name} and its characteristics`,
      })
      reasoning.startStep(step1Id)
      
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate processing
      reasoning.completeStep(step1Id, `Analyzed ${location.name} with tags: ${location.tags?.join(', ') || 'none'}`)
      
      // Try Gemini API first
      const { gemini } = await import('@/config/gemini')
      if (gemini.enabled) {
        // Step 2: Generate alternative with AI
        const step2Id = reasoning.addStep({
          id: `replace-${id}-2`,
          title: 'Generating alternative location',
          description: 'Using AI to find similar locations',
        })
        reasoning.startStep(step2Id)
        
        const altName = await generateAlternativeLocation(
          location.name,
          destination,
          interests.length > 0 ? interests : location.tags || []
        )
        
        reasoning.completeStep(step2Id, `AI suggested: ${altName}`)
        
        // Step 3: Verify location exists
        const step3Id = reasoning.addStep({
          id: `replace-${id}-3`,
          title: 'Verifying location',
          description: 'Checking if location exists on Google Maps',
        })
        reasoning.startStep(step3Id)
        
        const coords = await geocodeAddress(`${altName}, ${destination}`)
        
        if (coords) {
          reasoning.completeStep(step3Id, `Location verified at coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
          
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === id
                ? {
                    ...loc,
                    name: altName,
                    aiExplanation: `Alternative location similar to ${location.name}. ${altName} offers a similar experience.`,
                  }
                : loc
            )
          )
        } else {
          reasoning.failStep(step3Id, 'Location not found on Google Maps, using fallback')
          
          // Fallback to local generation
          const alternative = generateAlt(location)
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === id
                ? {
                    ...loc,
                    name: alternative.name,
                    aiExplanation: `Alternative location similar to ${location.name}. ${alternative.name} offers a similar experience.`,
                  }
                : loc
            )
          )
        }
      } else {
        // Step 2: Fallback generation
        const step2Id = reasoning.addStep({
          id: `replace-${id}-2`,
          title: 'Using fallback generation',
          description: 'AI not available, using local alternatives',
        })
        reasoning.startStep(step2Id)
        
        const alternative = generateAlt(location)
        reasoning.completeStep(step2Id, `Generated alternative: ${alternative.name}`)
        
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === id
              ? {
                  ...loc,
                  name: alternative.name,
                  aiExplanation: `Alternative location similar to ${location.name}. ${alternative.name} offers a similar experience.`,
                }
              : loc
          )
        )
      }
    } catch (error) {
      console.error('Error generating alternative:', error)
      
      const errorStepId = reasoning.addStep({
        id: `replace-${id}-error`,
        title: 'Error occurred',
        description: 'An error occurred during generation',
      })
      reasoning.failStep(errorStepId, error instanceof Error ? error.message : 'Unknown error')
      
      // Fallback
      const alternative = generateAlt(location)
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === id
            ? {
                ...loc,
                name: alternative.name,
                aiExplanation: `Alternative location similar to ${location.name}.`,
              }
            : loc
        )
      )
    } finally {
      setGenerating(null)
    }
  }
  
  // Generate locations based on destination on mount
  useEffect(() => {
    let isMounted = true
    
    const generateLocations = async () => {
      // Get destination from trip or default
      const tripDestination = currentTrip?.destination || 'Tokyo, Japan'
      const tripDays = currentTrip?.days ? parseInt(currentTrip.days) : 5
      const tripInterests = currentTrip?.interests || []

      if (!currentTrip) {
        console.warn('No trip data found, redirecting to trip creation')
        // Redirect to trip creation instead of showing Japan locations
        router.push('/app/home')
        return
      }
      
      console.log('Generating locations for:', {
        destination: tripDestination,
        days: tripDays,
        interests: tripInterests
      })

      // Create unique session ID to prevent duplicate step IDs
      const sessionId = Date.now().toString(36)
      
      if (!isMounted) return
      
      setLoading(true)
      reasoning.reset()
      reasoning.setIsOpen(true)

      try {
        // Step 1: Get destination coordinates
        const step1Id = reasoning.addStep({
          id: `get-coords-${sessionId}`,
          title: 'Getting destination coordinates',
          description: `Finding location for ${tripDestination}`,
        })
        if (!isMounted) return
        reasoning.startStep(step1Id)

        const coords = await geocodeAddress(tripDestination)
        if (!isMounted) return
        
        if (!coords) {
          throw new Error(`Could not find coordinates for ${tripDestination}`)
        }
        reasoning.completeStep(step1Id, `Found ${tripDestination} at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)

        // Step 2: Generate location suggestions with AI
        const step2Id = reasoning.addStep({
          id: `generate-suggestions-${sessionId}`,
          title: 'Generating location suggestions',
          description: 'Using AI to suggest places to visit',
        })
        if (!isMounted) return
        reasoning.startStep(step2Id)

        const { gemini } = await import('@/config/gemini')
        let locationNames: string[] = []
        let locationExplanations: Map<string, string> = new Map()

        if (gemini.enabled && gemini.apiKey) {
          try {
            locationNames = await generateLocationSuggestions(tripDestination, tripDays, tripInterests)
            if (!isMounted) return
            
            // Generate explanations for all locations in ONE API call
            if (locationNames.length > 0) {
              const locationsWithExplanations = await generateLocationsWithExplanations(
                tripDestination,
                tripDays,
                tripInterests,
                locationNames
              )
              // Create a map for quick lookup
              locationsWithExplanations.forEach(item => {
                locationExplanations.set(item.name.toLowerCase(), item.explanation)
              })
            }
            
            reasoning.completeStep(step2Id, `AI suggested ${locationNames.length} locations with explanations`)
          } catch (error) {
            console.error('Error generating suggestions:', error)
            if (!isMounted) return
            reasoning.completeStep(step2Id, 'Using Google Places search instead')
          }
        }

        // Step 3: Search for places using Google Maps
        const step3Id = reasoning.addStep({
          id: `search-places-${sessionId}`,
          title: 'Searching for places',
          description: 'Finding locations on Google Maps',
        })
        if (!isMounted) return
        reasoning.startStep(step3Id)

        const targetLocationCount = 25 // Always aim for 20-25 locations
        let foundLocations: LocationWithIncluded[] = []
        const seenNames = new Set<string>() // Prevent duplicates

        if (locationNames.length > 0) {
          // Use AI-generated names and get coordinates
          console.log(`Searching for ${locationNames.length} AI-suggested locations in ${tripDestination}`)
          for (const name of locationNames) {
            if (foundLocations.length >= targetLocationCount) break
            
            try {
              // Search with the location name in the destination
              const searchQuery = `${name}, ${tripDestination}`
              const places = await searchPlaces(searchQuery, coords, 20000) // Increased radius
              
              if (places.length > 0) {
                const place = places[0]
                // Check for duplicates
                if (!seenNames.has(place.name.toLowerCase())) {
                  seenNames.add(place.name.toLowerCase())
                  // Use pre-generated explanation if available
                  const explanation = locationExplanations.get(place.name.toLowerCase()) || 
                                     locationExplanations.get(name.toLowerCase()) ||
                                     `AI-suggested location in ${tripDestination}`
                  
                  foundLocations.push({
                    id: String(foundLocations.length + 1),
                    name: place.name,
                    lat: place.lat,
                    lng: place.lng,
                    category: place.category || 'culture',
                    tags: tripInterests.length > 0 ? tripInterests : ['culture'],
                    included: true,
                    aiExplanation: explanation,
                  })
                }
              }
            } catch (error) {
              console.error(`Error searching for ${name}:`, error)
            }
          }
        }

        // If we don't have enough locations, search by interests and general queries
        if (foundLocations.length < targetLocationCount) {
          console.log(`Only found ${foundLocations.length} locations, searching for more...`)
          
          // Build comprehensive search queries
          const searchQueries: string[] = []
          
          if (tripInterests.length > 0) {
            // Add interest-based queries
            tripInterests.forEach(interest => {
              searchQueries.push(`${interest} in ${tripDestination}`)
              searchQueries.push(`best ${interest} places in ${tripDestination}`)
            })
          }
          
          // Add general tourism queries
          searchQueries.push(
            `tourist attractions in ${tripDestination}`,
            `must visit places in ${tripDestination}`,
            `top attractions in ${tripDestination}`,
            `famous landmarks in ${tripDestination}`,
            `popular destinations in ${tripDestination}`,
            `things to see in ${tripDestination}`,
            `sights in ${tripDestination}`
          )

          // Search with multiple queries to get enough results
          for (const query of searchQueries) {
            if (foundLocations.length >= targetLocationCount) break
            
            try {
              const places = await searchPlaces(query, coords, 20000) // Increased radius
              
              places.forEach((place) => {
                if (foundLocations.length >= targetLocationCount) return
                
                // Check for duplicates
                if (!seenNames.has(place.name.toLowerCase())) {
                  seenNames.add(place.name.toLowerCase())
                  foundLocations.push({
                    id: String(foundLocations.length + 1),
                    name: place.name,
                    lat: place.lat,
                    lng: place.lng,
                    category: place.category || 'culture',
                    tags: tripInterests.length > 0 ? tripInterests : ['culture'],
                    included: true,
                    aiExplanation: `Popular location in ${tripDestination}`,
                  })
                }
              })
            } catch (error) {
              console.error(`Error searching for ${query}:`, error)
            }
          }
        }

        // Only use sample locations as absolute last resort if we found nothing
        if (foundLocations.length === 0) {
          console.warn(`No locations found for ${tripDestination}, using fallback`)
          // Don't use sample locations - they're Japan-specific
          // Instead, show an error message
          throw new Error(`Could not find any locations for ${tripDestination}. Please check the destination name and try again.`)
        }
        
        console.log(`Successfully found ${foundLocations.length} locations for ${tripDestination}`)

        reasoning.completeStep(step3Id, `Found ${foundLocations.length} locations`)
        
        // If we have locations from Google Places that don't have explanations yet, 
        // generate them in ONE batch API call (only if we have many without explanations)
        if (gemini.enabled && gemini.apiKey && isMounted && foundLocations.length > 0) {
          const locationsWithoutExplanations = foundLocations.filter(
            loc => !loc.aiExplanation || loc.aiExplanation.includes('Popular location') || loc.aiExplanation.includes('AI-suggested')
          )
          
          if (locationsWithoutExplanations.length > 5) {
            // Only generate if we have many locations without good explanations
            const step4Id = reasoning.addStep({
              id: `generate-explanations-${sessionId}`,
              title: 'Generating location explanations',
              description: 'Creating personalized descriptions',
            })
            if (!isMounted) return
            reasoning.startStep(step4Id)

            try {
              const namesToExplain = locationsWithoutExplanations.map(loc => loc.name)
              const batchExplanations = await generateLocationsWithExplanations(
                tripDestination,
                tripDays,
                tripInterests,
                namesToExplain
              )
              
              // Update locations with explanations
              const explanationMap = new Map(
                batchExplanations.map(item => [item.name.toLowerCase(), item.explanation])
              )
              
              if (isMounted) {
                setLocations((prev) =>
                  prev.map((loc) => {
                    const explanation = explanationMap.get(loc.name.toLowerCase())
                    return explanation ? { ...loc, aiExplanation: explanation } : loc
                  })
                )
                reasoning.completeStep(step4Id, `Generated ${batchExplanations.length} personalized explanations`)
              }
            } catch (error) {
              console.error('Error generating batch explanations:', error)
              if (isMounted) {
                reasoning.completeStep(step4Id, 'Explanations skipped due to rate limit')
              }
            }
          }
        }
        
        setLocations(foundLocations)

        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        if (!isMounted) return
        
        console.error('Error generating locations:', error)
        console.error('Destination was:', tripDestination)
        console.error('Current trip:', currentTrip)
        
        const sessionId = Date.now().toString(36)
        const errorStepId = reasoning.addStep({
          id: `error-${sessionId}`,
          title: 'Error generating locations',
          description: 'An error occurred',
        })
        reasoning.failStep(errorStepId, error instanceof Error ? error.message : 'Unknown error')
        
        // Don't use sample locations - they're Japan-specific
        // Show error message instead
        setLocations([])
        setLoading(false)
        
        // Show alert to user
        alert(`Could not generate locations for ${tripDestination}. Please check:\n1. The destination name is correct\n2. Google Maps API is configured\n3. Try a different destination name`)
      }
    }

    generateLocations()
    
    return () => {
      isMounted = false
    }
  }, [currentTrip])

  const handleConfirm = () => {
    const includedLocations = locations.filter((loc) => loc.included)
    if (includedLocations.length === 0) {
      alert('Please include at least one location')
      return
    }
    
    // Save selected locations to store
    setSelectedLocations(includedLocations)
    
    // Generate itinerary days from locations
    const daysCount = currentTrip?.days ? parseInt(currentTrip.days) : Math.ceil(includedLocations.length / 3)
    const locationsPerDay = Math.ceil(includedLocations.length / daysCount)
    const itineraryDays = []
    
    for (let i = 0; i < daysCount; i++) {
      const dayLocations = includedLocations.slice(i * locationsPerDay, (i + 1) * locationsPerDay)
      itineraryDays.push({
        id: String(i + 1),
        day: i + 1,
        locations: dayLocations.map(loc => loc.name),
        estimatedTime: `${dayLocations.length * 2}-${dayLocations.length * 3} hours`,
        distance: `${(dayLocations.length * 1.5).toFixed(1)} km`,
        pace: currentTrip?.pace === 'relaxed' ? 'relaxed' : currentTrip?.pace === 'packed' ? 'rushed' : 'balanced' as 'relaxed' | 'balanced' | 'rushed',
        notes: '',
        budget: `$${dayLocations.length * 20}-${dayLocations.length * 40}`,
      })
    }
    
    setItinerary(itineraryDays)
    router.push('/app/itinerary')
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
        {/* AI Reasoning Panel */}
        {reasoning.steps.length > 0 && (
          <div className="mb-6">
            <AIReasoningPanel
              steps={reasoning.steps}
              isOpen={reasoning.isOpen}
              onToggle={() => reasoning.setIsOpen(!reasoning.isOpen)}
              title="AI Generation Process"
              defaultExpanded={true}
            />
          </div>
        )}
        
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Select Your Locations
          </h1>
          <p className="text-gray-600">
            {loading 
              ? `Generating AI-suggested places for ${destination}...`
              : `Review and customize the AI-suggested places for ${destination}. Drag to reorder, or replace with alternatives.`
            }
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Generating locations...</span>
          </div>
        )}

        {!loading && locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No locations found for {destination}</p>
            <button
              onClick={() => router.push('/app/home')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Start Over
            </button>
          </div>
        )}

        {!loading && locations.length > 0 && (
          <Reorder.Group
            axis="y"
            values={locations}
            onReorder={setLocations}
            className="space-y-4 mb-8"
          >
          {locations.map((location) => (
            <Reorder.Item
              key={location.id}
              value={location}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="flex gap-4 p-4 md:p-6 hover:scale-[1.01] transition-transform">
                {/* Image */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                  <Image
                    src={getImageUrl(location.image, 'location')}
                    alt={location.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">
                        {location.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {location.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReplace(location.id)}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Replace with alternative"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleLocation(location.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          location.included
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {location.included ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Why this place:</span>{' '}
                        {location.aiExplanation}
                      </p>
                    </div>
                  </div>
                </div>

                <GripVertical className="w-6 h-6 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
              </div>
            </Reorder.Item>
          ))}
          </Reorder.Group>
        )}

        {!loading && locations.length > 0 && (
          <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
          >
            Confirm & Generate Routes
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
