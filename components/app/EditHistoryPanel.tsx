'use client'

import { useState, useEffect } from 'react'
import { History, User, Plus, Trash2, Move, Edit, Users } from 'lucide-react'
import { EditHistoryEntry } from '@/types'
import { trackedFetch } from '@/lib/utils/tracked-fetch'

interface EditHistoryPanelProps {
  itineraryId: string
}

export default function EditHistoryPanel({ itineraryId }: EditHistoryPanelProps) {
  const [history, setHistory] = useState<EditHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadHistory()
  }, [itineraryId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await trackedFetch(`/api/edit-history?itineraryId=${itineraryId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to load edit history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'location_added':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'location_removed':
        return <Trash2 className="w-4 h-4 text-red-600" />
      case 'location_moved':
        return <Move className="w-4 h-4 text-blue-600" />
      case 'trip_updated':
      case 'itinerary_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'collaborator_added':
      case 'collaborator_removed':
      case 'collaborator_role_updated':
        return <Users className="w-4 h-4 text-purple-600" />
      default:
        return <Edit className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionLabel = (entry: EditHistoryEntry) => {
    switch (entry.action_type) {
      case 'location_added':
        return `Added location "${entry.details.location_name || 'location'}"`
      case 'location_removed':
        return `Removed location "${entry.details.location_name || 'location'}"`
      case 'location_moved':
        return `Moved location "${entry.details.location_name || 'location'}"`
      case 'trip_updated':
        return 'Updated trip details'
      case 'itinerary_updated':
        return 'Updated itinerary'
      case 'collaborator_added':
        return `Added collaborator "${entry.details.collaborator_user_id}"`
      case 'collaborator_removed':
        return `Removed collaborator "${entry.details.collaborator_user_id}"`
      case 'collaborator_role_updated':
        return `Changed role of "${entry.details.collaborator_user_id}" to ${entry.details.new_role}`
      default:
        return entry.action_type.replace(/_/g, ' ')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-600">Loading edit history...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-bold text-gray-900">Edit History</h3>
        <span className="text-sm text-gray-500">({history.length})</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">No edit history yet</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">{getActionIcon(entry.action_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{getActionLabel(entry)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3 text-gray-500" />
                  <p className="text-xs text-gray-600">{entry.user_id}</p>
                  <span className="text-gray-400">•</span>
                  <p className="text-xs text-gray-500">{formatTime(entry.created_at)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
