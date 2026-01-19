'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Settings, Shield, Lock, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { checkIsAdmin } from '@/lib/auth/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!isAuthenticated) {
        setIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      const adminStatus = await checkIsAdmin()
      setIsAdmin(adminStatus)
      setCheckingAdmin(false)

      if (!adminStatus && !authLoading) {
        // Not admin - redirect to home
        router.push('/app/home?error=admin_access_required')
      }
    }

    if (!authLoading) {
      checkAdmin()
    }
  }, [isAuthenticated, authLoading, router])

  // Show loading state
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            {!isAuthenticated
              ? 'You must be logged in to access the admin panel.'
              : 'You do not have permission to access the admin panel.'}
          </p>
          <div className="flex gap-3 justify-center">
            {!isAuthenticated ? (
              <Link
                href="/app"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </Link>
            ) : (
              <>
                <Link
                  href="/app/home"
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go Home
                </Link>
                <button
                  onClick={signOut}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-xl font-bold text-gray-900"
              >
                <Shield className="w-6 h-6 text-primary-600" />
                Admin Panel
              </Link>
              {user && (
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/app/home"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
