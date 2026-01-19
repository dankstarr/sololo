'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import appConfig from '@/config/app.config'

export default function Hero() {
  // Safety check for hero data
  if (!appConfig.hero) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-4 sm:mb-6">
            Loading...
          </h1>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Animated Map Background */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <m.path
            d="M 100 400 Q 300 200, 500 400 T 900 400"
            stroke="#0ea5e9"
            strokeWidth="3"
            fill="none"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            animate={{
              strokeDashoffset: 0,
            }}
            transition={{
              duration: appConfig.animations.routeDrawDuration / 1000,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
          <m.circle
            cx="100"
            cy="400"
            r="8"
            fill="#0ea5e9"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: appConfig.animations.pinBounceDuration / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <m.circle
            cx="500"
            cy="400"
            r="8"
            fill="#0ea5e9"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
              ease: 'easeInOut',
            }}
          />
          <m.circle
            cx="900"
            cy="400"
            r="8"
            fill="#0ea5e9"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          <span className="inline-block hover:animate-glitch">
            {appConfig.hero.headline}
          </span>
          <br />
          <span className="text-primary-600">{appConfig.hero.headlineHighlight}</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
          {appConfig.hero.subheadline}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link
            href={appConfig.hero.primaryCTA.href}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group min-h-[44px]"
          >
            {appConfig.hero.primaryCTA.text}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href={appConfig.hero.secondaryCTA.href}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold text-base sm:text-lg hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-h-[44px] flex items-center justify-center"
          >
            {appConfig.hero.secondaryCTA.text}
          </Link>
        </div>
      </div>
    </section>
  )
}
