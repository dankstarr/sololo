'use client'

import { Check, Copy } from 'lucide-react'

export function ShareableLinkCard({
  shareUrl,
  currentShareId,
  copied,
  onCopy,
}: {
  shareUrl: string | null
  currentShareId: string | null
  copied: boolean
  onCopy: () => void
}) {
  if (!shareUrl && !currentShareId) return null

  const computedUrl =
    shareUrl ||
    (typeof window !== 'undefined' && currentShareId
      ? `${window.location.origin}/discover/share/${currentShareId}`
      : '')

  return (
    <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary mb-1">Shareable Link</p>
          <p className="text-xs text-gray-600 break-all">{computedUrl}</p>
          <p className="text-xs text-gray-500 mt-1">
            Share this link with friends to let them view your itinerary
          </p>
        </div>
        <button
          onClick={onCopy}
          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all flex items-center gap-2 shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

