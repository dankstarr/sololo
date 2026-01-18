'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m, Reorder } from 'framer-motion'
import {
  Check,
  X,
  GripVertical,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface Location {
  id: string
  name: string
  image: string
  tags: string[]
  aiExplanation: string
  included: boolean
}

export default function LocationSelection() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Senso-ji Temple',
      image: '/placeholder-temple.jpg',
      tags: ['culture', 'history', 'scenic'],
      aiExplanation:
        'Tokyo’s oldest temple, perfect for experiencing traditional Japanese culture. Great for morning visits to avoid crowds.',
      included: true,
    },
    {
      id: '2',
      name: 'Tsukiji Outer Market',
      image: '/placeholder-market.jpg',
      tags: ['food', 'local gem'],
      aiExplanation:
        'Authentic food market with fresh sushi and local snacks. Best visited early morning for the freshest experience.',
      included: true,
    },
    {
      id: '3',
      name: 'Shibuya Crossing',
      image: '/placeholder-crossing.jpg',
      tags: ['culture', 'scenic'],
      aiExplanation:
        'Iconic intersection representing modern Tokyo. Best viewed from Shibuya Sky or nearby cafes.',
      included: true,
    },
    {
      id: '4',
      name: 'Meiji Shrine',
      image: '/placeholder-shrine.jpg',
      tags: ['culture', 'nature', 'scenic'],
      aiExplanation:
        'Peaceful shrine surrounded by forest in the heart of the city. A calm escape from urban Tokyo.',
      included: true,
    },
    {
      id: '5',
      name: 'TeamLab Borderless',
      image: '/placeholder-teamlab.jpg',
      tags: ['art', 'scenic'],
      aiExplanation:
        'Immersive digital art experience. Book tickets in advance as it’s very popular.',
      included: false,
    },
  ])

  const toggleLocation = (id: string) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id ? { ...loc, included: !loc.included } : loc
      )
    )
  }

  const handleReplace = (id: string) => {
    // In a real app, this would fetch alternative locations
    alert('Fetching nearby alternatives...')
  }

  const handleConfirm = () => {
    const includedLocations = locations.filter((loc) => loc.included)
    if (includedLocations.length === 0) {
      alert('Please include at least one location')
      return
    }
    router.push('/app/itinerary')
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
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
            Review and customize the AI-suggested places. Drag to reorder, or
            replace with alternatives.
          </p>
        </div>

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
                {/* Image Placeholder */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Image</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">
                        {location.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {location.tags.map((tag) => (
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

        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
          >
            Confirm & Generate Routes
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
