'use client'

import { useUserSync } from '@/hooks'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sync user data from Supabase on mount
  useUserSync()

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
