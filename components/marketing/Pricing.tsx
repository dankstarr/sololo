'use client'

import { m } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import appConfig from '@/config/app.config'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '20 itinerary generations',
        'Basic route optimization',
        'Online maps & guides',
        'Community trips access',
      ],
      cta: 'Get Started',
      ctaLink: '/app',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited trips',
        'Offline audio & maps',
        'Advanced routing',
        'Priority groups',
        'Early access features',
        'Premium support',
      ],
      cta: 'Upgrade to Pro',
      ctaLink: '/app/upgrade',
      popular: true,
    },
  ]

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-8 sm:mb-12 md:mb-16">
          Simple Pricing
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <m.div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-6 sm:p-8 border-2 z-10 ${
                plan.popular
                  ? 'border-primary-600 md:scale-105'
                  : 'border-gray-300'
              }`}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{ 
                ...{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: plan.popular ? '#2D5A27' : '#D1D5DB',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  zIndex: 10
                },
                opacity: 1 
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600 ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
