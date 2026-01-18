'use client'

import { m } from 'framer-motion'
import {
  X,
  Clock,
  MapPin,
  Users,
  Shield,
  Play,
  Bookmark,
  Share2,
  Edit,
} from 'lucide-react'

interface LocationDetailProps {
  location: {
    name: string
    description: string
    openingHours: string
    address: string
    crowdEstimate: string
    safetyNotes: string
    photos: string[]
  }
  onClose: () => void
}

export default function LocationDetail({
  location,
  onClose,
}: LocationDetailProps) {
  return (
    <m.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-detail-title"
      transition={{ duration: 0.2 }}
    >
      <m.div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        role="document"
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 id="location-detail-title" className="text-xl sm:text-2xl font-bold text-gray-900 pr-2">{location.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            aria-label="Close location details"
          >
            <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Photos Placeholder */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-400 text-sm">Photo {i}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{location.description}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Opening Hours
                </p>
                <p className="text-sm text-gray-600">{location.openingHours}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Crowd Estimate
                </p>
                <p className="text-sm text-gray-600">{location.crowdEstimate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Safety Notes
                </p>
                <p className="text-sm text-gray-600">{location.safetyNotes}</p>
              </div>
            </div>
          </div>

          {/* Audio Guide Info */}
          <div className="bg-primary-50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Play className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary-900 mb-1">
                  Audio Guide Available
                </p>
                <p className="text-xs text-primary-700">
                  Using shared library guide (reused to save resources)
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              className="flex-1 min-w-[140px] px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] text-sm sm:text-base"
              aria-label="Play audio guide for this location"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Play Audio Guide</span>
              <span className="sm:hidden">Play</span>
            </button>
            <button className="px-3 sm:px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Bookmark location">
              <Bookmark className="w-5 h-5" />
            </button>
            <button className="px-3 sm:px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Share location">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="px-3 sm:px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Edit location">
              <Edit className="w-5 h-5" />
            </button>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add Note
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              rows={3}
              placeholder="Add your personal notes about this location..."
            />
          </div>
        </div>
      </m.div>
    </m.div>
  )
}
