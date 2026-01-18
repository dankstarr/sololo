'use client'

import { m } from 'framer-motion'
import { MapPin, CheckCircle, Route } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: MapPin,
      title: 'Enter destination, days, interests',
      description:
        'Tell us where you want to go, how long you have, and what you love. Our AI understands your travel style.',
    },
    {
      icon: CheckCircle,
      title: 'Confirm AI-suggested locations',
      description:
        'Review and customize the perfect places for you. Add, remove, or reorder locations before we plan your route.',
    },
    {
      icon: Route,
      title: 'Walk optimized routes with audio guidance',
      description:
        'Follow circular routes that minimize backtracking. Listen to hands-free audio guides as you explore.',
    },
  ]

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
                className="bg-gradient-to-br from-primary-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-primary-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
