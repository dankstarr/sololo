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
import appConfig from '@/config/app.config'

const iconMap: Record<string, any> = {
  Sparkles,
  Route,
  Map,
  Headphones,
  Users,
  Compass,
  Download,
}

export default function Features() {
  // Safety check for features data
  if (!appConfig.features || !Array.isArray(appConfig.features) || appConfig.features.length === 0) {
    return (
      <section id="features" className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-white to-primary-50">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            Features
          </h2>
          <p className="text-center text-gray-600">Loading features...</p>
        </div>
      </section>
    )
  }

  const features = appConfig.features.map((feature) => ({
    ...feature,
    icon: iconMap[feature.icon] || Sparkles,
    title: feature.title || '',
    description: feature.description || '',
  }))

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
                className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 group cursor-pointer relative z-10"
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: appConfig.animations.fadeIn / 1000,
                  delay: index * (appConfig.animations.staggerDelay / 1000),
                }}
                style={{ 
                  ...{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', position: 'relative', zIndex: 10 },
                  opacity: 1 
                }}
                whileHover={{
                  scale: appConfig.animations.hoverScale,
                  transition: { duration: appConfig.animations.hoverDuration / 1000 },
                }}
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base" style={{ color: '#4B5563' }}>
                  {feature.description || 'No description available'}
                </p>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
