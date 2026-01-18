'use client'

import { usePathname } from 'next/navigation'
import AppNav from '@/components/app/AppNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Don't show nav on onboarding page
  const showNav = pathname !== '/app'

  return (
    <div className="min-h-screen">
      {showNav && <AppNav />}
      {children}
    </div>
  )
}
