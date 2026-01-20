'use client'

import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Edit,
  Gauge,
  Heart,
  Info,
  MapPin,
  Navigation,
  Route,
} from 'lucide-react'
import type { TripFormData } from '@/types'

export function TripDetailsSection({
  tripFormData,
  setTripFormData,
  tripDetailsExpanded,
  setTripDetailsExpanded,
  editingTripDetails,
  setEditingTripDetails,
  enrichedInfoTab,
  setEnrichedInfoTab,
  availableInterests,
  onSave,
  onCancel,
}: {
  tripFormData: TripFormData
  setTripFormData: (next: TripFormData) => void
  tripDetailsExpanded: boolean
  setTripDetailsExpanded: (next: boolean) => void
  editingTripDetails: boolean
  setEditingTripDetails: (next: boolean) => void
  enrichedInfoTab: 'overview' | 'practical' | 'cultural'
  setEnrichedInfoTab: (next: 'overview' | 'practical' | 'cultural') => void
  availableInterests: Array<{ id: string; label: string; icon: string }>
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <>
      {/* Trip Details Section - Collapsible */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <button
          onClick={() => setTripDetailsExpanded(!tripDetailsExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-900">Trip Details</h2>
          <div className="flex items-center gap-3">
            {!editingTripDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTripDetails(true)
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {tripDetailsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {tripDetailsExpanded && (
          <div className="px-6 pb-6 border-t">
            {editingTripDetails ? (
              <div className="space-y-4">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
                  <input
                    type="text"
                    value={tripFormData.destination}
                    onChange={(e) => setTripFormData({ ...tripFormData, destination: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Enter destination"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Days</label>
                  <input
                    type="number"
                    min="1"
                    value={tripFormData.days}
                    onChange={(e) => setTripFormData({ ...tripFormData, days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={tripFormData.dates.start}
                      onChange={(e) =>
                        setTripFormData({
                          ...tripFormData,
                          dates: { ...tripFormData.dates, start: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={tripFormData.dates.end}
                      onChange={(e) =>
                        setTripFormData({
                          ...tripFormData,
                          dates: { ...tripFormData.dates, end: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map((interest) => {
                      const isSelected = tripFormData.interests.includes(interest.id)
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => {
                            const newInterests = isSelected
                              ? tripFormData.interests.filter((i) => i !== interest.id)
                              : [...tripFormData.interests, interest.id]
                            setTripFormData({ ...tripFormData, interests: newInterests })
                          }}
                          className={`px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary-100 border-primary-300 text-primary-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-1">{interest.icon}</span>
                          {interest.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Travel Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Mode</label>
                  <div className="flex gap-3">
                    {(['walking', 'driving', 'mixed'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTripFormData({ ...tripFormData, travelMode: mode })}
                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                          tripFormData.travelMode === mode
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pace</label>
                  <div className="flex gap-3">
                    {(['relaxed', 'balanced', 'packed'] as const).map((pace) => (
                      <button
                        key={pace}
                        type="button"
                        onClick={() => setTripFormData({ ...tripFormData, pace })}
                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                          tripFormData.pace === pace
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pace}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessibility */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="accessibility"
                    checked={tripFormData.accessibility}
                    onChange={(e) => setTripFormData({ ...tripFormData, accessibility: e.target.checked })}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                  />
                  <label htmlFor="accessibility" className="text-sm font-semibold text-gray-700">
                    Accessibility requirements
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={onSave}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Destination</span>
                  </div>
                  <p className="text-gray-900 font-medium">{tripFormData.destination}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Duration</span>
                  </div>
                  <p className="text-gray-900 font-medium">{tripFormData.days} days</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Dates</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {new Date(tripFormData.dates.start).toLocaleDateString()} -{' '}
                    {new Date(tripFormData.dates.end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Travel Mode</span>
                  </div>
                  <p className="text-gray-900 font-medium capitalize">{tripFormData.travelMode}</p>
                </div>
                {tripFormData.interests.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Interests</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tripFormData.interests.map((interestId) => {
                        const interest = availableInterests.find((i) => i.id === interestId)
                        return interest ? (
                          <span
                            key={interestId}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                          >
                            {interest.icon} {interest.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Pace</span>
                  </div>
                  <p className="text-gray-900 font-medium capitalize">{tripFormData.pace}</p>
                </div>
                {tripFormData.accessibility && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Accessibility</span>
                    </div>
                    <p className="text-gray-900 font-medium">Enabled</p>
                  </div>
                )}

                {tripFormData.timezone && (
                  <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                      <button
                        onClick={() => setEnrichedInfoTab('overview')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          enrichedInfoTab === 'overview'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setEnrichedInfoTab('practical')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          enrichedInfoTab === 'practical'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Practical Info
                      </button>
                      <button
                        onClick={() => setEnrichedInfoTab('cultural')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          enrichedInfoTab === 'cultural'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Cultural
                      </button>
                    </div>

                    {enrichedInfoTab === 'overview' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {tripFormData.timezone && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-700">Timezone</span>
                            </div>
                            <p className="text-sm text-gray-900">{tripFormData.timezone.split(' ')[0]}</p>
                          </div>
                        )}
                        {tripFormData.currency && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-700">Currency</span>
                            </div>
                            <p className="text-sm text-gray-900">
                              {tripFormData.currency.split('(')[0].trim()}
                            </p>
                          </div>
                        )}
                        {tripFormData.language && tripFormData.language.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Info className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-700">Language</span>
                            </div>
                            <p className="text-sm text-gray-900">{tripFormData.language[0]}</p>
                          </div>
                        )}
                        {tripFormData.weather && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Info className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-700">Weather</span>
                            </div>
                            <p className="text-sm text-gray-900">{tripFormData.weather.season}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {enrichedInfoTab === 'practical' && (
                      <div className="space-y-3">
                        {tripFormData.emergencyContacts && tripFormData.emergencyContacts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              Emergency Contacts
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {tripFormData.emergencyContacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">{contact.name}</p>
                                    <p className="text-xs text-gray-600 capitalize">{contact.type}</p>
                                  </div>
                                  <a
                                    href={`tel:${contact.number}`}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                                  >
                                    {contact.number}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tripFormData.moneyTips && tripFormData.moneyTips.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Money Tips</h4>
                              <ul className="space-y-1">
                                {tripFormData.moneyTips.map((tip, idx) => (
                                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {tripFormData.communicationTips && tripFormData.communicationTips.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Communication</h4>
                              <ul className="space-y-1">
                                {tripFormData.communicationTips.map((tip, idx) => (
                                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {tripFormData.localTransportation && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Route className="w-4 h-4 text-primary-600" />
                              Transportation
                            </h4>
                            {tripFormData.localTransportation.options && (
                              <p className="text-xs text-gray-700 mb-1">
                                <strong>Options:</strong> {tripFormData.localTransportation.options.join(', ')}
                              </p>
                            )}
                            {tripFormData.localTransportation.cost && (
                              <p className="text-xs text-gray-700">
                                <strong>Cost:</strong> {tripFormData.localTransportation.cost}
                              </p>
                            )}
                          </div>
                        )}

                        {tripFormData.packingList && tripFormData.packingList.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Packing List</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {tripFormData.packingList.map((item, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {enrichedInfoTab === 'cultural' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tripFormData.localCustoms && tripFormData.localCustoms.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Local Customs</h4>
                            <ul className="space-y-1">
                              {tripFormData.localCustoms.map((custom, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-primary-600 mt-1">•</span>
                                  <span>{custom}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tripFormData.culturalEtiquette && tripFormData.culturalEtiquette.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Cultural Etiquette</h4>
                            <ul className="space-y-1">
                              {tripFormData.culturalEtiquette.map((tip, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-primary-600 mt-1">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

