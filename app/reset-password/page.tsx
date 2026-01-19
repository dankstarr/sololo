'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (type === 'recovery' && accessToken) {
      // User is coming from password reset email
      // Supabase will handle the session automatically
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push('/app/home')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Sololo</h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Set New Password</h2>
            <p className="text-gray-600 mt-2">Enter your new password below</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold mb-2">✓ Password Updated!</p>
                <p className="text-green-600 text-sm">
                  Your password has been successfully updated. Redirecting...
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  icon={<Lock className="w-4 h-4" />}
                />
                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  Update Password
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-primary hover:underline flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
