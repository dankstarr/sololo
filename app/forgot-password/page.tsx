'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Sparkles } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.')
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
            <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
            <p className="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold mb-2">✓ Email Sent!</p>
                <p className="text-green-600 text-sm">
                  Check your inbox for a password reset link. The link will expire in 1 hour.
                </p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  icon={<Mail className="w-4 h-4" />}
                />
                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  Send Reset Link
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
