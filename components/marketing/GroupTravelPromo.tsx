'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import appConfig from '@/config/app.config'

export default function GroupTravelPromo() {
  // Safety check for groupPromo data
  if (!appConfig.groupPromo) {
    return (
      <section className="py-12 sm:py-16 bg-primary-600">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-center text-white">Loading...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16 bg-primary-600">
      <div className="container mx-auto px-4 sm:px-6">
        <m.div
          className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {appConfig.groupPromo.headline}
              </h3>
              <p className="text-gray-600 text-lg">
                {appConfig.groupPromo.description}
              </p>
            </div>
            <Link
              href={appConfig.groupPromo.cta.href}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group min-h-[44px]"
            >
              {appConfig.groupPromo.cta.text}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </m.div>
      </div>
    </section>
  )
}
