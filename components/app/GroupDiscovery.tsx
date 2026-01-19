'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Users, Calendar, MapPin, ArrowRight, Plus, MessageCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sampleGroups } from '@/config/sample-data'
import { useAppStore } from '@/store/useAppStore'
import { Group } from '@/types'
import { getImageUrl } from '@/lib/utils'

// Prepare demo groups at module level - always available, no hooks needed
const DEMO_GROUPS: Group[] = sampleGroups.map((group) => ({
  ...group,
  description: `Group exploring ${group.destination} with interests in ${group.interests?.join(', ') || 'various'}`,
}))

console.log('Module level - DEMO_GROUPS prepared:', DEMO_GROUPS.length, DEMO_GROUPS)

// Helper function to get destination-based placeholder image
function getDestinationImage(destination: string): string {
  // Extract city name for image selection
  const city = destination.split(',')[0].trim().toLowerCase()
  
  // Create a simple hash from the destination to get consistent but varied images
  let hash = 0
  for (let i = 0; i < city.length; i++) {
    hash = ((hash << 5) - hash) + city.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Use different travel-related Unsplash images based on hash
  // These are curated travel destination images
  const travelImages = [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&q=80', // Travel
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop&q=80', // Road trip
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&q=80', // Mountains
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop&q=80', // Cityscape
    'https://images.unsplash.com/photo-1501785888041-af3effcb1f6d?w=400&h=300&fit=crop&q=80', // Beach
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop&q=80', // Landscape
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop&q=80', // Architecture
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop&q=80', // Culture
  ]
  
  // Use hash to select an image (ensures same destination gets same image)
  const imageIndex = Math.abs(hash) % travelImages.length
  return travelImages[imageIndex]
}

export default function GroupDiscovery() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { groups: storeGroups, setGroups, setCurrentGroup, addGroup, currentTrip, currentTripId, userProfile } = useAppStore()
  const action = searchParams.get('action')
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  
  // Get user-created groups (those not in demo data)
  const demoGroupIds = new Set(DEMO_GROUPS.map(g => g.id))
  const userCreatedGroups = storeGroups.filter(g => !demoGroupIds.has(g.id))
  
  // Always show demo groups first, then any user-created groups
  const groups: Group[] = [...DEMO_GROUPS, ...userCreatedGroups]
  
  // (removed debug-only logging)

  // Hydrate user-created groups from Supabase (server route)
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/groups')
        if (!res.ok) return
        const dbGroups = (await res.json()) as Group[]
        const merged = new Map<string, Group>()
        ;[...storeGroups, ...(dbGroups || [])].forEach((g) => merged.set(g.id, g))
        setGroups(Array.from(merged.values()))
      } catch (e) {
        console.warn('Failed to load groups from DB:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (action === 'create') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <button
            onClick={() => router.push('/app/groups')}
            className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Create a Group
          </h1>
          <p className="text-gray-600 mb-8">
            Create a group for your trip. Others can find and join if they’re
            going to the same place at similar dates.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="e.g., Tokyo Adventure March 2024"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                rows={4}
                placeholder="Tell others about your trip plans..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/app/groups')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const destination = currentTrip?.destination || 'Tokyo, Japan'
                    const startDate = currentTrip?.dates.start || new Date().toISOString().split('T')[0]
                    const endDate = currentTrip?.dates.end || new Date().toISOString().split('T')[0]

                    const res = await fetch('/api/groups', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: userProfile?.id,
                        tripId: currentTripId,
                        name: groupName || null,
                        destination,
                        startDate,
                        endDate,
                        maxMembers: 10,
                        interests: currentTrip?.interests || [],
                        description:
                          groupDescription || `Group exploring ${destination}`,
                      }),
                    })
                    if (!res.ok) throw new Error('Failed to create group')
                    const created = (await res.json()) as Group
                    addGroup(created)
                    setCurrentGroup(created)
                    router.push(`/app/groups/${created.id}/chat`)
                  } catch (e) {
                    console.error('Create group failed:', e)
                    alert('Failed to create group. Please try again.')
                  }
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Find Travel Groups
            </h1>
            <p className="text-gray-600">
              Connect with travelers going to the same destination
            </p>
          </div>
          <button
            onClick={() => router.push('/app/groups?action=create')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Always render groups - DEMO_GROUPS should never be empty */}
        <div className="space-y-4" data-testid="groups-container">
          {groups.length === 0 ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>ERROR:</strong> No groups found! DEMO_GROUPS={DEMO_GROUPS.length}, storeGroups={storeGroups.length}
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-2">Showing {groups.length} groups</div>
              {groups.map((group, index) => {
                // Generate a destination-based image URL
                const imageUrl = getDestinationImage(group.destination)
                
                return (
                  <div
                    key={group.id}
                    className="card-modern tilt-card bg-white rounded-xl shadow-lg overflow-hidden scroll-fade-in"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={group.destination}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 256px"
                        />
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              <h3 className="text-xl font-bold text-gray-900">
                                {group.name || group.destination}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">
                                  {group.startDate} - {group.endDate}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">
                                  {group.memberCount}/{group.maxMembers} members
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-4">{group.description}</p>
                            {group.interests && group.interests.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {group.interests.map((interest) => (
                                  <span
                                    key={interest}
                                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full capitalize"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setCurrentGroup(group)
                                router.push(`/app/groups/${group.id}/chat`)
                              }}
                              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 hover-lift hover-glow flex items-center gap-2"
                            >
                              Join Group
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
