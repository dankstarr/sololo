import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/marketing/Header'
import Hero from '@/components/marketing/Hero'

// Lazy load below-the-fold components
const HowItWorks = dynamic(() => import('@/components/marketing/HowItWorks'), {
  loading: () => <div className="h-96" />,
})
const Features = dynamic(() => import('@/components/marketing/Features'), {
  loading: () => <div className="h-96" />,
})
const GroupTravelPromo = dynamic(() => import('@/components/marketing/GroupTravelPromo'), {
  loading: () => <div className="h-64" />,
})
const Pricing = dynamic(() => import('@/components/marketing/Pricing'), {
  loading: () => <div className="h-96" />,
})
const Footer = dynamic(() => import('@/components/marketing/Footer'), {
  loading: () => <div className="h-64" />,
})

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen">
      <Header />
      <Hero />
      <Suspense fallback={<div className="h-96" />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Features />
      </Suspense>
      <Suspense fallback={<div className="h-64" />}>
        <GroupTravelPromo />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Pricing />
      </Suspense>
      <Suspense fallback={<div className="h-64" />}>
        <Footer />
      </Suspense>
    </main>
  )
}
