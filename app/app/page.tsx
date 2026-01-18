import { redirect } from 'next/navigation'
import Onboarding from '@/components/app/Onboarding'

export default function AppPage() {
  // In a real app, this would check authentication state
  // For now, we'll show onboarding for new users
  return <Onboarding />
}
