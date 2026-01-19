'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Battery,
  Lock,
  Settings,
  Music,
  X,
  ArrowLeft,
} from 'lucide-react'

interface AudioGuideProps {
  onClose?: () => void
}

export default function AudioGuide({ onClose }: AudioGuideProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(180) // 3 minutes in seconds
  const [showSettings, setShowSettings] = useState(false)
  const [narratorStyle, setNarratorStyle] = useState('friendly')
  const [ambientSounds, setAmbientSounds] = useState(false)
  const [adaptiveLength, setAdaptiveLength] = useState(true)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const narratorStyles = [
    { id: 'friendly', label: 'Friendly Local' },
    { id: 'historian', label: 'Historian' },
    { id: 'calm', label: 'Calm Narrator' },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 z-50 flex items-center justify-center">
      {/* Settings Panel */}
      {showSettings && (
        <m.div
          className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSettings(false)}
          transition={{ duration: 0.2 }}
        >
          <m.div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Audio Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Narrator Style
                </label>
                <div className="space-y-2">
                  {narratorStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setNarratorStyle(style.id)}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                        narratorStyle === style.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ambient Background Sounds
                  </label>
                  <p className="text-xs text-gray-500">
                    Add subtle environmental audio
                  </p>
                </div>
                <button
                  onClick={() => setAmbientSounds(!ambientSounds)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    ambientSounds ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      ambientSounds ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Adaptive Length
                  </label>
                  <p className="text-xs text-gray-500">
                    Adjust guide length based on location
                  </p>
                </div>
                <button
                  onClick={() => setAdaptiveLength(!adaptiveLength)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    adaptiveLength ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      adaptiveLength ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-primary-50 rounded-lg p-3">
                <p className="text-xs text-primary-700">
                  <strong>Note:</strong> If an audio guide already exists for
                  this location, it will be reused to save resources and expand
                  our shared library.
                </p>
              </div>
            </div>
          </m.div>
        </m.div>
      )}

      {/* Walk Mode UI - Minimal, Audio-First */}
      <div className="max-w-md w-full px-6 text-center relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
            aria-label="Close audio guide"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Senso-ji Temple
          </h2>
          <p className="text-primary-200">Audio Guide</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8" role="progressbar" aria-valuenow={currentTime} aria-valuemin={0} aria-valuemax={duration} aria-label="Audio progress">
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between text-primary-200 text-sm" aria-hidden="true">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Large Control Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
          <button
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800 min-h-[56px] min-w-[56px]"
            aria-label="Skip to previous location"
          >
            <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800 min-h-[80px] min-w-[80px]"
            aria-label={isPlaying ? 'Pause audio guide' : 'Play audio guide'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600" aria-hidden="true" />
            ) : (
              <Play className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 ml-1" aria-hidden="true" />
            )}
          </button>

          <button
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800 min-h-[56px] min-w-[56px]"
            aria-label="Skip to next location"
          >
            <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-6 text-primary-200 text-sm">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Background play enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Works with lock screen</span>
          </div>
        </div>

        {/* Battery Saver Mode */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="flex items-center justify-center gap-2 text-primary-200 text-sm mb-4">
            <Battery className="w-4 h-4" />
            <span>Battery saver mode: Reduced animations</span>
          </div>
          {ambientSounds && (
            <div className="flex items-center justify-center gap-2 text-primary-200 text-sm mb-4">
              <Music className="w-4 h-4" />
              <span>Ambient sounds enabled</span>
            </div>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-primary-200 hover:text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
