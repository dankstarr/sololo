'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Navigation, User, Menu, X } from 'lucide-react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-white/90 backdrop-blur-sm py-6'
      }`}
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
          <Link
            href="/discover"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
          >
            Discover
          </Link>
          <Link
            href="/discover/locations"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
          >
            Top Locations
          </Link>
          <Link
            href="/app/itinerary"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1"
            style={{ color: '#374151' }}
          >
            Itinerary
          </Link>
          <Link
            href="/app/profile"
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded px-2 py-1 flex items-center gap-1"
            style={{ color: '#374151' }}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 min-h-[44px] flex items-center"
            aria-label="Plan a trip - Start creating your itinerary"
          >
            <span className="hidden sm:inline">Plan a Trip</span>
            <span className="sm:hidden">Plan</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="marketing-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="marketing-mobile-menu"
          className="md:hidden container mx-auto px-4 sm:px-6 pt-3 pb-4"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
            >
              Discover
            </Link>
            <Link
              href="/discover/locations"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
            >
              Top Locations
            </Link>
            <Link
              href="/app/itinerary"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
            >
              Itinerary
            </Link>
            <Link
              href="/app/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
