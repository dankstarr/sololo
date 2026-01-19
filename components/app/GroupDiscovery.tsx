'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { m } from 'framer-motion'
import { Users, Calendar, MapPin, ArrowRight, Plus, MessageCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sampleGroups } from '@/config/sample-data'
import { useAppStore } from '@/store/useAppStore'
import { Group } from '@/types'

export default function GroupDiscovery() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { groups: storeGroups, setGroups, setCurrentGroup, addGroup, currentTrip } = useAppStore()
  const action = searchParams.get('action')
  
  // Initialize groups from store or sample data
  useEffect(() => {
    if (storeGroups.length === 0) {
      const initialGroups = sampleGroups.map((group) => ({
        ...group,
        description: `Group exploring ${group.destination} with interests in ${group.interests?.join(', ') || 'various'}`,
      }))
      setGroups(initialGroups)
    }
  }, [storeGroups.length, setGroups])
  
  const groups = storeGroups.length > 0 ? storeGroups : sampleGroups.map((group) => ({
    ...group,
    description: `Group exploring ${group.destination} with interests in ${group.interests?.join(', ') || 'various'}`,
  }))

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
                onClick={() => {
                  // Create new group from form data
                  const newGroup: Group = {
                    id: `group-${Date.now()}`,
                    destination: currentTrip?.destination || 'Tokyo, Japan',
                    startDate: currentTrip?.dates.start || new Date().toISOString().split('T')[0],
                    endDate: currentTrip?.dates.end || new Date().toISOString().split('T')[0],
                    memberCount: 1,
                    maxMembers: 10,
                    interests: currentTrip?.interests || [],
                    description: `Group exploring ${currentTrip?.destination || 'Tokyo, Japan'}`,
                  }
                  addGroup(newGroup)
                  setCurrentGroup(newGroup)
                  router.push(`/app/groups/${newGroup.id}/chat`)
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

        {groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a group for this destination!
            </p>
            <button
              onClick={() => router.push('/app/groups?action=create')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
            >
              Create a Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <m.div
                key={group.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {group.destination}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
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
                    <button
                      onClick={() => {
                        setCurrentGroup(group)
                        router.push(`/app/groups/${group.id}/chat`)
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center gap-2"
                    >
                      Join Group
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
