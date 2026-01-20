'use client'

import { ChevronDown, ChevronUp, MapPin, Sparkles } from 'lucide-react'
import type { Day, Location, TripFormData } from '@/types'

export function AISuggestionsSection({
  days,
  selectedLocations,
  tripFormData,
  expanded,
  onToggle,
}: {
  days: Day[]
  selectedLocations: Location[]
  tripFormData: TripFormData | null
  expanded: boolean
  onToggle: () => void
}) {
  const hasAny =
    selectedLocations && selectedLocations.length > 0 && selectedLocations.some((loc) => loc.aiExplanation)

  if (!hasAny) return null

  const explainedCount = selectedLocations.filter((loc) => loc.aiExplanation).length

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">AI Suggestions</h2>
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
            {explainedCount} locations
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t">
          <p className="text-sm text-gray-600 mb-4 mt-4">
            AI-generated insights about why each location is worth visiting based on your trip preferences.
          </p>
          <div className="space-y-4">
            {days.map((day) => {
              const dayLocations = selectedLocations.filter(
                (loc) => day.locations?.includes(loc.name) && loc.aiExplanation
              )

              if (dayLocations.length === 0) return null

              return (
                <div key={day.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {day.day}
                    </div>
                    <h3 className="font-semibold text-gray-900">Day {day.day} - AI Insights</h3>
                  </div>
                  <div className="space-y-3">
                    {dayLocations.map((location) => (
                      <div
                        key={location.id || location.name}
                        className="bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-600" />
                          {location.name}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{location.aiExplanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {tripFormData && (
              <div className="border border-primary-200 rounded-lg p-4 bg-primary-50 mt-4">
                <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  General AI Tips for Your Trip
                </h3>
                <div className="space-y-2 text-sm text-primary-800">
                  {tripFormData.pace === 'packed' && (
                    <p className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Your itinerary is packed! Consider booking skip-the-line tickets in advance to maximize your
                        time.
                      </span>
                    </p>
                  )}
                  {tripFormData.pace === 'relaxed' && (
                    <p className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        With a relaxed pace, you have time to explore each location thoroughly. Don&apos;t rush - enjoy the
                        experience!
                      </span>
                    </p>
                  )}
                  {tripFormData.travelMode === 'walking' && (
                    <p className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Walking mode selected - wear comfortable shoes and stay hydrated. Consider public transport for
                        longer distances.
                      </span>
                    </p>
                  )}
                  {tripFormData.travelMode === 'driving' && (
                    <p className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Driving mode - check parking availability at each location and consider traffic patterns when
                        planning.
                      </span>
                    </p>
                  )}
                  {tripFormData.interests.length > 0 && (
                    <p className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Your interests ({tripFormData.interests.join(', ')}) have been considered when selecting
                        locations. Each spot aligns with what you love!
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

