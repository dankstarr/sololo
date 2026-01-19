'use client'

import { Inbox, MapPin, Users, Compass } from 'lucide-react'

interface EmptyStateProps {
  type: 'trips' | 'groups' | 'discover' | 'locations'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  type,
  title,
  description,
  action,
}: EmptyStateProps) {
  const icons = {
    trips: MapPin,
    groups: Users,
    discover: Compass,
    locations: MapPin,
  }

  const Icon = icons[type] || Inbox

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
