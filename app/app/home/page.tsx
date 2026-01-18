import TripCreation from '@/components/app/TripCreation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-6 py-8">
        <TripCreation />
      </div>
    </div>
  )
}
