'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Home, Map, Users, Compass, Menu, X, Calendar, Shield, Navigation } from 'lucide-react'
import { useState } from 'react'

export default function AppNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/app/home', label: 'Home', icon: Home },
    { href: '/app/itinerary', label: 'Itinerary', icon: Calendar },
    { href: '/app/map', label: 'Map', icon: Map },
    { href: '/app/groups', label: 'Groups', icon: Users },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/discover/locations', label: 'Top Locations', icon: Navigation },
  ]

  // Show admin link if on admin page
  const showAdminLink = pathname?.startsWith('/admin')

  // Don't show nav on onboarding
  if (pathname === '/app') return null

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" aria-label="Application navigation">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded" aria-label="Sololo home">
            <MapPin className="w-6 h-6 text-primary-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">Sololo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                showAdminLink
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={showAdminLink ? 'page' : undefined}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div id="mobile-navigation" className="md:hidden border-t border-gray-200 py-4" role="menu">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showAdminLink
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
