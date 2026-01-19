'use client'

import { m } from 'framer-motion'
import { MapPin, CheckCircle, Route } from 'lucide-react'
import appConfig from '@/config/app.config'

const iconMap: Record<string, any> = {
  MapPin,
  CheckCircle,
  Route,
}

export default function HowItWorks() {
  // Safety check for howItWorks data
  if (!appConfig.howItWorks || !Array.isArray(appConfig.howItWorks) || appConfig.howItWorks.length === 0) {
    return (
      <section id="how-it-works" className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
            How It Works
          </h2>
          <p className="text-center text-gray-600">Loading steps...</p>
        </div>
      </section>
    )
  }

  const steps = appConfig.howItWorks.map((step) => ({
    ...step,
    icon: iconMap[step.icon] || MapPin,
    title: step.title || '',
    description: step.description || '',
  }))

  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
          How It Works
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <m.div
                key={index}
                className="bg-gradient-to-br from-primary-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-primary-200 relative z-10"
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: appConfig.animations.scrollReveal / 1000,
                  delay: index * (appConfig.animations.scrollRevealDelay / 1000),
                }}
                style={{ 
                  ...{ backgroundColor: '#F0F9F0', borderColor: '#BAE6BA', position: 'relative', zIndex: 10 },
                  opacity: 1 
                }}
                whileHover={{
                  scale: appConfig.animations.hoverScale,
                  transition: { duration: appConfig.animations.hoverDuration / 1000 },
                }}
              >
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed" style={{ color: '#4B5563' }}>
                  {step.description || 'No description available'}
                </p>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
