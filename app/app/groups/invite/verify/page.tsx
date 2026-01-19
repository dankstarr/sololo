'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Users, MapPin, Calendar } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  groupId: string
  groupName: string
  destination: string
  expiresAt: string
}

export default function VerifyInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    // Verify token and get invitation details
    fetch(`/api/groups/invite/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Invalid invitation')
        }
        return res.json()
      })
      .then((data) => {
        setInvitation(data.invitation)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to verify invitation')
        setLoading(false)
      })
  }, [token])

  const handleAccept = async () => {
    if (!token) return

    setVerifying(true)
    setError(null)

    try {
      const res = await fetch('/api/groups/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      
      // Redirect to group chat after 2 seconds
      setTimeout(() => {
        router.push(`/app/groups/${data.groupId}/chat`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/app/groups')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
          >
            Go to Groups
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Successfully Joined!
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;ve been added to the group. Redirecting to chat...
          </p>
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Users className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Group Invitation
          </h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join a travel group
          </p>
        </div>

        {invitation && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {invitation.groupName}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span>{invitation.destination}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>
                  Expires:{' '}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/app/groups')}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={verifying}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Accept Invitation'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
