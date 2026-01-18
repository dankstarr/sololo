import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SkipLink from '@/components/common/SkipLink'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <SkipLink />
        {children}
      </body>
    </html>
  )
}
