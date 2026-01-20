'use client'

import { useMemo } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Edit,
  Info,
  Route,
  X,
} from 'lucide-react'
import type { Day, Location } from '@/types'

export function DaysGrid({
  days,
  expandedDays,
  toggleDay,
  editingDayId,
  setEditingDayId,
  selectedLocations,
  moveLocation,
  removeLocation,
  addLocationToDay,
}: {
  days: Day[]
  expandedDays: Set<string>
  toggleDay: (dayId: string) => void
  editingDayId: string | null
  setEditingDayId: (dayId: string | null) => void
  selectedLocations: Location[]
  moveLocation: (dayId: string, index: number, direction: 'up' | 'down') => void
  removeLocation: (dayId: string, index: number) => void
  addLocationToDay: (dayId: string, locationName: string) => void
}) {
  const selectableLocationsByDay = useMemo(() => {
    const byDay: Record<string, Location[]> = {}
    for (const day of days) {
      byDay[day.id] = (selectedLocations || []).filter((loc) => !day.locations?.includes(loc.name))
    }
    return byDay
  }, [days, selectedLocations])

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary Days</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {days.map((day) => {
          const isExpanded = expandedDays.has(day.id)
          return (
            <div key={day.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleDay(day.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                    {day.day}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5">Day {day.day}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {day.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        {day.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {day.budget}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {day.pace === 'rushed' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                      <AlertCircle className="w-3 h-3" />
                      Rushed
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in duration-300 border-t">
                  <div className="pt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Locations ({day.locations?.length || 0})
                        </h4>
                        {editingDayId === day.id && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Editing</span>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {day.locations?.map((location, idx) => (
                          <li
                            key={idx}
                            className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors text-sm ${
                              editingDayId === day.id ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-gray-700 font-medium truncate">{location}</span>
                            {editingDayId === day.id && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveLocation(day.id, idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveLocation(day.id, idx, 'down')}
                                  disabled={idx === (day.locations?.length || 0) - 1}
                                  className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeLocation(day.id, idx)}
                                  className="p-1 rounded bg-white border border-red-300 hover:bg-red-50 transition-all"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3 text-red-600" />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {editingDayId === day.id && selectedLocations.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Add Location</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectableLocationsByDay[day.id] || []).map((loc) => (
                              <button
                                key={loc.id || loc.name}
                                type="button"
                                onClick={() => addLocationToDay(day.id, loc.name)}
                                className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 border border-primary-200 transition-all"
                              >
                                + {loc.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {day.bestTimeToVisit && (
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="font-semibold text-blue-900 mb-0.5">Best Time</p>
                          <p className="text-blue-700">{day.bestTimeToVisit.split(' ')[0]}</p>
                        </div>
                      )}
                      {day.transportation && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="font-semibold text-gray-900 mb-0.5">Transport</p>
                          <p className="text-gray-700">{day.transportation.mode?.split(' ')[0]}</p>
                        </div>
                      )}
                    </div>

                    {((day.localTips?.length ?? 0) > 0 ||
                      (day.safetyTips?.length ?? 0) > 0 ||
                      (day.culturalNotes?.length ?? 0) > 0) && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-900 flex items-center gap-2 list-none">
                          <Info className="w-4 h-4 text-primary-600" />
                          <span>Tips & Notes</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform ml-auto" />
                        </summary>
                        <div className="mt-2 space-y-2 pl-6">
                          {day.localTips && day.localTips.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Local Tips</p>
                              <ul className="space-y-0.5">
                                {day.localTips.slice(0, 3).map((tip, idx) => (
                                  <li key={idx} className="text-xs text-gray-600">
                                    • {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {day.safetyTips && day.safetyTips.length > 0 && (
                            <div className="bg-yellow-50 rounded p-2">
                              <p className="text-xs font-semibold text-yellow-900 mb-1">Safety</p>
                              <ul className="space-y-0.5">
                                {day.safetyTips.slice(0, 2).map((tip, idx) => (
                                  <li key={idx} className="text-xs text-yellow-800">
                                    • {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {day.culturalNotes && day.culturalNotes.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Cultural</p>
                              <ul className="space-y-0.5">
                                {day.culturalNotes.slice(0, 2).map((note, idx) => (
                                  <li key={idx} className="text-xs text-gray-600">
                                    • {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    <div>
                      <textarea
                        defaultValue={day.notes}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        rows={2}
                        placeholder="Add notes for this day..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingDayId(editingDayId === day.id ? null : day.id)}
                      className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      {editingDayId === day.id ? 'Done Editing' : 'Edit Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

