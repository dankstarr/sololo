'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useOffline } from '@/hooks'

interface OfflineIndicatorProps {
  className?: string
  showLabel?: boolean
}

export default function OfflineIndicator({ className = '', showLabel = true }: OfflineIndicatorProps) {
  const isOffline = useOffline()

  return (
    <div className={`bg-white rounded-lg shadow-lg px-3 md:px-4 py-2 flex items-center gap-2 ${className}`}>
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 text-orange-600" />
          {showLabel && <span className="text-xs md:text-sm text-gray-700">Offline</span>}
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 text-green-600" />
          {showLabel && <span className="text-xs md:text-sm text-gray-700">Online</span>}
        </>
      )}
    </div>
  )
}
