'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, MapPin, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    homeBase: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })

      if (signInError) throw signInError

      if (data.user) {
        router.push('/app/home')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            full_name: registerForm.name,
            home_base: registerForm.homeBase,
          },
          emailRedirectTo: `${window.location.origin}/app/home`,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Create user profile
        await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            name: registerForm.name,
            email: registerForm.email,
            home_base: registerForm.homeBase || null,
          }),
        })

        // Send welcome email
        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: registerForm.email,
              name: registerForm.name,
              userId: data.user.id,
            }),
          })
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError)
          // Don't fail registration if email fails
        }

        setSuccess('Account created successfully! Please check your email to verify your account.')
        
        // Clear form
        setRegisterForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          homeBase: '',
        })

        // Auto-switch to login after 3 seconds
        setTimeout(() => {
          setIsLogin(true)
          setSuccess(null)
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
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
            <p className="text-gray-600">Your AI Travel Companion</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setIsLogin(true)
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                isLogin
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                !isLogin
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="you@example.com"
                required
                icon={<Mail className="w-4 h-4" />}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
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
              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                placeholder="John Doe"
                required
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder="you@example.com"
                required
                icon={<Mail className="w-4 h-4" />}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
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
                label="Confirm Password"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
                icon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Home Base (Optional)"
                type="text"
                value={registerForm.homeBase}
                onChange={(e) => setRegisterForm({ ...registerForm, homeBase: e.target.value })}
                placeholder="e.g., London, UK"
                icon={<MapPin className="w-4 h-4" />}
              />
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Sign In */}
          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Terms */}
          <div className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to Sololo&apos;s{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}
