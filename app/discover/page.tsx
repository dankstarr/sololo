import DiscoverPage from '@/components/app/DiscoverPage'
import AppNav from '@/components/app/AppNav'

export default function Discover() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <AppNav />
      <DiscoverPage />
    </div>
  )
}
