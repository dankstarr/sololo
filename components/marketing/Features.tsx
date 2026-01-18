'use client'

import { m } from 'framer-motion'
import {
  Sparkles,
  Route,
  Map,
  Headphones,
  Users,
  Compass,
  Download,
} from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI itinerary generator',
      description: 'Get personalized trip plans tailored to your interests and travel style.',
    },
    {
      icon: Route,
      title: 'Day-wise circular routes',
      description: 'Optimized paths that minimize backtracking and maximize your time.',
    },
    {
      icon: Map,
      title: 'Google Maps integration',
      description: 'Seamlessly sync with Google Maps for navigation and saved places.',
    },
    {
      icon: Headphones,
      title: 'Audio travel buddy',
      description: 'Hands-free audio guides that work even when your phone is locked.',
    },
    {
      icon: Users,
      title: 'Group travel & chats',
      description: 'Connect with travelers going to the same place at similar dates.',
    },
    {
      icon: Compass,
      title: 'Discover trips & guides',
      description: 'Explore popular routes and audio guides created by the community.',
    },
    {
      icon: Download,
      title: 'Offline mode',
      description: 'Download routes, maps, and audio guides for offline use anywhere.',
    },
  ]

  return (
    <section id="features" className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-white to-primary-50">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
          Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <m.div
                key={index}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
