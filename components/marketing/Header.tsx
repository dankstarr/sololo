'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import { MapPin, Calendar, Navigation } from 'lucide-react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <m.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-white/90 backdrop-blur-sm py-6'
      }`}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ 
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50
      }}
      role="banner"
    >
      <nav className="container mx-auto px-4 sm:px-6 flex items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Sololo home">
          <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 group-hover:text-primary-700 transition-colors" aria-hidden="true" />
          <span className="text-xl sm:text-2xl font-bold text-gray-900">Sololo</span>
        </Link>

        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <a
            href="#how-it-works"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
            onClick={(e) => {
              e.preventDefault()
              if (typeof document !== 'undefined') {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            aria-label="Navigate to How It Works section"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
            onClick={(e) => {
              e.preventDefault()
              if (typeof document !== 'undefined') {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            aria-label="Navigate to Features section"
          >
            Features
          </a>
          <Link
            href="/discover"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
          >
            Discover
          </Link>
          <Link
            href="/discover/locations"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1 flex items-center gap-1"
            style={{ color: '#374151' }}
          >
            <Navigation className="w-4 h-4" />
            Top Locations
          </Link>
          <Link
            href="/app/itinerary"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1 flex items-center gap-1"
            style={{ color: '#374151' }}
          >
            <Calendar className="w-4 h-4" />
            Itinerary
          </Link>
          <a
            href="#pricing"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
            onClick={(e) => {
              e.preventDefault()
              if (typeof document !== 'undefined') {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            aria-label="Navigate to Pricing section"
          >
            Pricing
          </a>
        </div>

        <Link
          href="/app"
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] flex items-center"
          aria-label="Plan a trip - Start creating your itinerary"
        >
          <span className="hidden sm:inline">Plan a Trip</span>
          <span className="sm:hidden">Plan</span>
        </Link>
      </nav>
    </m.header>
  )
}
