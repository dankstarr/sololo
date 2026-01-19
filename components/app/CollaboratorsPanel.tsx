'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, X, Crown, Edit, Eye, Mail } from 'lucide-react'
import { Collaborator } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { trackedFetch } from '@/lib/utils/tracked-fetch'
import Button from '@/components/ui/Button'

interface CollaboratorsPanelProps {
  itineraryId: string
  currentUserId?: string
}

export default function CollaboratorsPanel({ itineraryId, currentUserId }: CollaboratorsPanelProps) {
  const { userProfile } = useAppStore()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    void loadCollaborators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const response = await trackedFetch(`/api/collaborators?itineraryId=${itineraryId}`)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data)
      }
    } catch (error) {
      console.error('Failed to load collaborators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      // For now, we'll use email as userId. In production, you'd look up the user by email first
      const response = await trackedFetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId,
          userId: inviteEmail.trim(), // In production, resolve email to userId
          role: 'editor',
          invitedBy: userProfile?.id || currentUserId,
        }),
      })

      if (response.ok) {
        setInviteEmail('')
        setShowInviteForm(false)
        void loadCollaborators()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to invite collaborator')
      }
    } catch (error) {
      console.error('Failed to invite collaborator:', error)
      alert('Failed to invite collaborator')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this collaborator?')) return

    try {
      const response = await trackedFetch(
        `/api/collaborators?itineraryId=${itineraryId}&userId=${userId}&removedBy=${userProfile?.id || currentUserId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        void loadCollaborators()
      } else {
        alert('Failed to remove collaborator')
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
      alert('Failed to remove collaborator')
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    try {
      const response = await trackedFetch('/api/collaborators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId,
          userId,
          role: newRole,
          updatedBy: userProfile?.id || currentUserId,
        }),
      })

      if (response.ok) {
        void loadCollaborators()
      } else {
        alert('Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const isCurrentUserAdmin = collaborators.some(
    (c) => c.user_id === (userProfile?.id || currentUserId) && c.role === 'admin'
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-600">Loading collaborators...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-900">Collaborators</h3>
          <span className="text-sm text-gray-500">({collaborators.length})</span>
        </div>
        {isCurrentUserAdmin && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>

      {showInviteForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  void handleInvite()
                }
              }}
            />
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2"
            >
              {inviting ? 'Inviting...' : 'Send'}
            </Button>
            <button
              onClick={() => {
                setShowInviteForm(false)
                setInviteEmail('')
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <p className="text-sm text-gray-600">No collaborators yet</p>
        ) : (
          collaborators.map((collab) => {
            const isCurrentUser = collab.user_id === (userProfile?.id || currentUserId)
            const canManage = isCurrentUserAdmin && !isCurrentUser

            return (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {collab.user_id}
                      {isCurrentUser && <span className="text-gray-500 ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-600">
                      {collab.joined_at
                        ? `Joined ${new Date(collab.joined_at).toLocaleDateString()}`
                        : `Invited ${new Date(collab.invited_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(collab.role)}
                    {canManage && (
                      <select
                        value={collab.role}
                        onChange={(e) =>
                          handleRoleChange(collab.user_id, e.target.value as 'viewer' | 'editor' | 'admin')
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {canManage && (
                      <button
                        onClick={() => handleRemove(collab.user_id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove collaborator"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
