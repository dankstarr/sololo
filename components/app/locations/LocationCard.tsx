'use client'

import { useEffect } from 'react'
import {
  MapPin,
  Star,
  Phone,
  Clock,
  DollarSign,
  ExternalLink,
  Map as MapIcon,
  RefreshCw,
  Info,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import type { DiscoverLocation } from '@/config/discover-locations'

type ResultsSource = 'static' | 'cached' | 'live'

type ViewMode = 'grid' | 'two-column' | 'list'

interface LocationCardProps {
  location: DiscoverLocation
  index: number
  viewMode: ViewMode
  isSelected: boolean
  isSaved: boolean
  enrichment: any
  isLoading: boolean
  AUTO_ENRICH_COUNT: number
  resultsSource: ResultsSource
  loadGoogleEnrichment: (location: DiscoverLocation, forceRefresh?: boolean) => void | Promise<void>
  toggleLocationSelection: (locationId: string) => void
  toggleLocationSave: (locationId: string, e: React.MouseEvent) => void
  handleOpenInGoogleMaps: (location: DiscoverLocation, e: React.MouseEvent) => void
  formatReviews: (count: number) => string
}

export function LocationCard({
  location,
  index,
  viewMode,
  isSelected,
  isSaved,
  enrichment,
  isLoading,
  AUTO_ENRICH_COUNT,
  resultsSource,
  loadGoogleEnrichment,
  toggleLocationSelection,
  toggleLocationSave,
  handleOpenInGoogleMaps,
  formatReviews,
}: LocationCardProps) {
  const isHighRated = (enrichment?.rating ?? location.rating) > 4.7
  const isListView = viewMode === 'list'

  // Only auto-enrich if NOT viewing cached city data (resultsSource !== 'cached')
  // When viewing cached data from Supabase, all info should already be in database - no API calls needed
  useEffect(() => {
    // Skip auto-enrichment when viewing cached city data to minimize API calls
    if (resultsSource === 'cached') {
      return
    }

    // Only auto-enrich top locations for live searches
    if (index < AUTO_ENRICH_COUNT) {
      void loadGoogleEnrichment(location)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, location.id, resultsSource])

  return (
    <div
      className={`bg-white rounded-2xl border ${
        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-gray-200 shadow'
      } p-4 md:p-5 ${
        isListView ? 'flex flex-row gap-4' : 'flex flex-col gap-4 h-full'
      } cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => toggleLocationSelection(location.id)}
    >
      <div className={`flex items-center gap-3 ${isListView ? 'flex-shrink-0' : ''}`}>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0">
          #{index + 1}
        </div>
        {!isListView && (
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 text-base md:text-lg">{location.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs bg-secondary/50 border-primary/20 text-primary">
                {location.category}
              </Badge>
              {(enrichment?.rating ?? location.rating) > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">
                    {(enrichment?.rating ?? location.rating).toFixed(1)}
                  </span>
                  {(enrichment?.reviews ?? location.reviews) > 0 && (
                    <span className="text-[11px] text-gray-500">
                      ({formatReviews(enrichment?.reviews ?? location.reviews)})
                    </span>
                  )}
                </div>
              )}
              {isHighRated && (
                <span className="text-[11px] text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                  ⭐ Top Rated
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isListView && (
          <div className="mb-2">
            <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">{location.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-secondary/50 border-primary/20 text-primary">
                {location.category}
              </Badge>
              {(enrichment?.rating ?? location.rating) > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">
                    {(enrichment?.rating ?? location.rating).toFixed(1)}
                  </span>
                  {(enrichment?.reviews ?? location.reviews) > 0 && (
                    <span className="text-[11px] text-gray-500">
                      ({formatReviews(enrichment?.reviews ?? location.reviews)})
                    </span>
                  )}
                </div>
              )}
              {isHighRated && (
                <span className="text-[11px] text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                  ⭐ Top Rated
                </span>
              )}
            </div>
          </div>
        )}
        <p className={`text-sm text-gray-700 leading-relaxed ${isListView ? '' : 'mt-1 md:mt-0'}`}>
          {enrichment?.description?.trim() || location.description}
        </p>

        {/* Address */}
        {enrichment?.address && (
          <div className="flex items-start gap-2 mt-2">
            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">{enrichment.address}</p>
          </div>
        )}

        {/* Phone */}
        {enrichment?.phone && (
          <div className="flex items-center gap-2 mt-2">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <a
              href={`tel:${enrichment.phone}`}
              className="text-xs text-gray-600 hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {enrichment.phone}
            </a>
          </div>
        )}

        {/* Opening Hours */}
        {enrichment?.openingHours && enrichment.openingHours.length > 0 && (
          <div className="mt-2">
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                {enrichment.openingHours.slice(0, 3).map((hours: string, idx: number) => (
                  <div key={idx}>{hours}</div>
                ))}
                {enrichment.openingHours.length > 3 && (
                  <div className="text-gray-400 italic">
                    +{enrichment.openingHours.length - 3} more days
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Price Level */}
        {enrichment?.priceLevel !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-gray-600">
              {enrichment.priceLevel === 0 && 'Free'}
              {enrichment.priceLevel === 1 && 'Inexpensive ($)'}
              {enrichment.priceLevel === 2 && 'Moderate ($$)'}
              {enrichment.priceLevel === 3 && 'Expensive ($$$)'}
              {enrichment.priceLevel === 4 && 'Very Expensive ($$$$)'}
            </span>
          </div>
        )}

        {/* Photos */}
        {enrichment?.photos && enrichment.photos.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {enrichment.photos.slice(0, 3).map((photo: string, idx: number) => (
              <a
                key={idx}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <img
                  src={photo}
                  alt={`${location.name} photo ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-primary transition-colors"
                />
              </a>
            ))}
            {enrichment.photos.length > 3 && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                +{enrichment.photos.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => toggleLocationSave(location.id, e)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSaved ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save location'}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
          <button
            onClick={(e) => handleOpenInGoogleMaps(location, e)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Maps</span>
          </button>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{location.distance} away</span>
          </div>

          {enrichment?.website && (
            <a
              href={enrichment.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </a>
          )}

          {enrichment?.googleMapsUrl && (
            <a
              href={enrichment.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Google Maps
            </a>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation()
              void loadGoogleEnrichment(location, !!enrichment) // Force refresh if enrichment exists
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Loading…
              </>
            ) : enrichment ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Details
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5" />
                Load Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

