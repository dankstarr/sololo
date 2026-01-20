'use client'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export interface BannerMessage {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
}

export function BannerMessages({
  banners,
  onRemove,
}: {
  banners: BannerMessage[]
  onRemove: (id: string) => void
}) {
  if (!banners || banners.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`animate-fade-in-up rounded-lg p-4 flex items-start justify-between gap-4 ${
            banner.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : banner.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3 flex-1">
            {banner.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                banner.type === 'error'
                  ? 'text-red-900'
                  : banner.type === 'success'
                  ? 'text-green-900'
                  : 'text-blue-900'
              }`}
            >
              {banner.message}
            </p>
          </div>
          <button
            onClick={() => onRemove(banner.id)}
            className={`flex-shrink-0 ${
              banner.type === 'error'
                ? 'text-red-600 hover:text-red-800'
                : banner.type === 'success'
                ? 'text-green-600 hover:text-green-800'
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

