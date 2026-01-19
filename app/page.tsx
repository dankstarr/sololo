import Hero from '@/components/marketing/Hero'
import HowItWorks from '@/components/marketing/HowItWorks'
import Features from '@/components/marketing/Features'
import GroupTravelPromo from '@/components/marketing/GroupTravelPromo'
import Pricing from '@/components/marketing/Pricing'
import Footer from '@/components/marketing/Footer'

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-white">
      <Hero />
      <HowItWorks />
      <Features />
      <GroupTravelPromo />
      <Pricing />
      <Footer />
    </main>
  )
}
