import type { Metadata } from 'next'
import './globals.css'
import SkipLink from '@/components/common/SkipLink'

export const metadata: Metadata = {
  title: {
    default: 'Sololo - Your AI Travel Companion',
    template: '%s | Sololo',
  },
  description: 'AI-powered travel companion for smarter, social travel. Plan trips, explore circular routes, listen to audio guides, and connect with travelers.',
  keywords: ['travel', 'itinerary', 'AI travel', 'travel planning', 'travel companion', 'trip planner'],
  authors: [{ name: 'Sololo' }],
  creator: 'Sololo',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sololo.com',
    title: 'Sololo - Your AI Travel Companion',
    description: 'AI-powered travel companion for smarter, social travel.',
    siteName: 'Sololo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sololo - Your AI Travel Companion',
    description: 'AI-powered travel companion for smarter, social travel.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  )
}
