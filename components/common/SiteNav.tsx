'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Compass, Home, Map, MapPin, Menu, Navigation, Shield, User, Users, X, Calendar } from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

export default function SiteNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/discover/locations', label: 'Top Locations', icon: Navigation },
    { href: '/app/home', label: 'App', icon: MapPin },
    { href: '/app/itinerary', label: 'Itinerary', icon: Calendar },
    { href: '/app/map', label: 'Map', icon: Map },
    { href: '/app/groups', label: 'Groups', icon: Users },
    { href: '/app/profile', label: 'Profile', icon: User },
  ]

  // Hide nav on onboarding entry page
  if (pathname === '/app') return null

  const showAdminLink = pathname?.startsWith('/admin')

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50" aria-label="Site navigation">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded"
            aria-label="Sololo home"
          >
            <MapPin className="w-6 h-6 text-primary-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">Sololo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              // Find the most specific (longest) matching nav item
              // This prevents /discover from being active when on /discover/locations
              let isActive = false
              if (item.href === '/') {
                isActive = pathname === '/'
              } else if (pathname) {
                // Check if this item matches
                const matches = pathname === item.href || pathname.startsWith(item.href + '/')
                if (matches) {
                  // Check if there's a more specific nav item that also matches
                  const moreSpecificMatch = navItems.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.length > item.href.length &&
                      (pathname === other.href || pathname.startsWith(other.href + '/'))
                  )
                  // Only active if no more specific match exists
                  isActive = !moreSpecificMatch
                }
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover-lift ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 hover-lift ${
                showAdminLink ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={showAdminLink ? 'page' : undefined}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div id="site-mobile-menu" className="md:hidden border-t border-gray-200 py-4" role="menu">
            {[...navItems, { href: '/admin', label: 'Admin', icon: Shield }].map((item) => {
              const Icon = item.icon
              // Find the most specific (longest) matching nav item
              // This prevents /discover from being active when on /discover/locations
              const allNavItems = [...navItems, { href: '/admin', label: 'Admin', icon: Shield }]
              let isActive = false
              if (item.href === '/') {
                isActive = pathname === '/'
              } else if (pathname) {
                // Check if this item matches
                const matches = pathname === item.href || pathname.startsWith(item.href + '/')
                if (matches) {
                  // Check if there's a more specific nav item that also matches
                  const moreSpecificMatch = allNavItems.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.length > item.href.length &&
                      (pathname === other.href || pathname.startsWith(other.href + '/'))
                  )
                  // Only active if no more specific match exists
                  isActive = !moreSpecificMatch
                }
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}

