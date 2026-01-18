'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    product: [
      { name: 'How It Works', href: '#how-it-works', isAnchor: true },
      { name: 'Features', href: '#features', isAnchor: true },
      { name: 'Pricing', href: '#pricing', isAnchor: true },
      { name: 'Discover', href: '/discover', isAnchor: false },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-primary-400" />
              <span className="text-xl font-bold text-white">Sololo</span>
            </Link>
            <p className="text-gray-400">
              Your AI travel companion for smarter, social travel.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  {link.isAnchor ? (
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault()
                        const element = document.querySelector(link.href)
                        element?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <p className="text-gray-400 mb-4">
              Follow us for travel tips and updates.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <span className="text-sm">𝕏</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Instagram"
              >
                <span className="text-sm">IG</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Sololo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
