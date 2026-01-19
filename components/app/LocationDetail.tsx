'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Clock,
  MapPin,
  Users,
  Shield,
  Play,
  Bookmark,
  Share2,
  Edit,
} from 'lucide-react'
import AudioGuide from './AudioGuide'
import { Modal, Button } from '@/components/ui'
import { shareLocation, getPlaceholderImage } from '@/lib/utils'
import { LocationDetail as LocationDetailType } from '@/types'

interface LocationDetailProps {
  location: LocationDetailType
  onClose: () => void
}

export default function LocationDetail({
  location,
  onClose,
}: LocationDetailProps) {
  const [showAudioGuide, setShowAudioGuide] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [note, setNote] = useState('')

  if (showAudioGuide) {
    return <AudioGuide onClose={() => setShowAudioGuide(false)} />
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={location.name}
      size="medium"
    >

      <div className="space-y-4 sm:space-y-6">
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
          <Button
            onClick={() => setShowAudioGuide(true)}
            icon={<Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="flex-1 min-w-[140px]"
            aria-label="Play audio guide for this location"
          >
            <span className="hidden sm:inline">Play Audio Guide</span>
            <span className="sm:hidden">Play</span>
          </Button>
          <Button
            onClick={() => {
              setIsBookmarked(!isBookmarked)
              alert(isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks')
            }}
            variant={isBookmarked ? 'primary' : 'secondary'}
            size="medium"
            icon={<Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />}
            className="min-w-[44px]"
            aria-label="Bookmark location"
          />
          <Button
            onClick={() => shareLocation(location)}
            variant="secondary"
            size="medium"
            icon={<Share2 className="w-5 h-5" />}
            className="min-w-[44px]"
            aria-label="Share location"
          />
          <Button
            onClick={() => {
              const newNote = prompt('Edit location notes:', note)
              if (newNote !== null) setNote(newNote)
            }}
            variant="secondary"
            size="medium"
            icon={<Edit className="w-5 h-5" />}
            className="min-w-[44px]"
            aria-label="Edit location"
          />
        </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              rows={3}
              placeholder="Add your personal notes about this location..."
            />
            {note && (
              <button
                onClick={() => {
                  alert('Note saved!')
                }}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all"
              >
                Save Note
              </button>
            )}
          </div>
      </div>
    </Modal>
  )
}
