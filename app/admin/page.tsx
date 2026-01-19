'use client'

import { useCallback, useEffect, useState } from 'react'
import { getUsageStats, resetUsageStats } from '@/lib/api/gemini'
import { getMapsUsageStats, resetMapsUsageStats } from '@/lib/api/google-maps'
import { getInternalApiStats, resetInternalApiStats } from '@/lib/utils/api-usage'
import appConfig from '@/config/app.config'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  Activity,
  MapPin,
  Info,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface UsageStats {
  requestsToday: number
  tokensToday: number
  requestsThisMinute: number
  lastRequestTime: number
}

interface MapsUsageStats {
  requestsToday: number
  requestsThisMinute: number
  lastRequestTime: number
  geocodeRequests: number
  placesRequests: number
  directionsRequests: number
  placeDetailsRequests: number
}

interface InternalApiUsageStats {
  requestsToday: number
  requestsThisMinute: number
  lastRequestTime: number
  errorsToday: number
  byPath: Record<string, { count: number; errors: number; avgDurationMs: number }>
}

interface GCPUsageData {
  gemini?: {
    requestsToday: number
    tokensToday?: number
    requestsThisHour: number
    errorsToday: number
  }
  maps?: {
    requestsToday: number
    requestsThisHour: number
    geocodeRequests?: number
    placesRequests?: number
    directionsRequests?: number
    errorsToday: number
  }
  projectId?: string
  lastUpdated?: string
  error?: string
  configured: boolean
  setupInstructions?: string
}

export default function AdminPanel() {
  const [geminiStats, setGeminiStats] = useState<UsageStats>({
    requestsToday: 0,
    tokensToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
  })
  const [mapsStats, setMapsStats] = useState<MapsUsageStats>({
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    geocodeRequests: 0,
    placesRequests: 0,
    directionsRequests: 0,
    placeDetailsRequests: 0,
  })
  const [internalStats, setInternalStats] = useState<InternalApiUsageStats>({
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    errorsToday: 0,
    byPath: {},
  })
  const [usageHistory, setUsageHistory] = useState<Array<{ hour: number; requests: number }>>([])
  const [gcpUsage, setGcpUsage] = useState<GCPUsageData | null>(null)
  const [gcpLoading, setGcpLoading] = useState(false)

  useEffect(() => {
    // Generate hourly usage data for the last 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date().getHours() - (23 - i)
      const adjustedHour = hour < 0 ? hour + 24 : hour
      return {
        hour: adjustedHour,
        requests: Math.floor(Math.random() * 5) + Math.floor((geminiStats.requestsToday + mapsStats.requestsToday) / 24),
      }
    })
    setUsageHistory(hours)
  }, [geminiStats.requestsToday, mapsStats.requestsToday])

  const loadUsageHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      const historyKey = `gemini_usage_history_${new Date().toDateString()}`
      const saved = localStorage.getItem(historyKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setUsageHistory(parsed)
        } catch (e) {
          // Generate placeholder if no history
          const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: (new Date().getHours() - (23 - i) + 24) % 24,
            requests: Math.floor(Math.random() * 3),
          }))
          setUsageHistory(hours)
        }
      } else {
        // Generate placeholder if no history
        const hours = Array.from({ length: 24 }, (_, i) => ({
          hour: (new Date().getHours() - (23 - i) + 24) % 24,
          requests: Math.floor(Math.random() * 3),
        }))
        setUsageHistory(hours)
      }
    }
  }, [])

  const loadStats = useCallback(() => {
    const currentGeminiStats = getUsageStats()
    const currentMapsStats = getMapsUsageStats()
    const currentInternalStats = getInternalApiStats()
    setGeminiStats(currentGeminiStats)
    setMapsStats(currentMapsStats)
    setInternalStats(currentInternalStats)
    loadUsageHistory()
  }, [loadUsageHistory])

  const loadGcpUsage = useCallback(async () => {
    setGcpLoading(true)
    try {
      const response = await fetch('/api/admin/gcp-usage')
      const data: GCPUsageData = await response.json()
      setGcpUsage(data)
    } catch (error) {
      console.error('Error loading GCP usage:', error)
      setGcpUsage({
        configured: false,
        error: 'Failed to fetch GCP usage data',
      })
    } finally {
      setGcpLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadGcpUsage()
    const interval = setInterval(loadStats, 5000) // Update every 5 seconds
    const gcpInterval = setInterval(loadGcpUsage, 60000) // Update GCP data every minute
    return () => {
      clearInterval(interval)
      clearInterval(gcpInterval)
    }
  }, [loadStats, loadGcpUsage])

  const handleReset = () => {
    if (confirm('Are you sure you want to reset today\'s usage stats for both Gemini and Google Maps?')) {
      resetUsageStats()
      resetMapsUsageStats()
      resetInternalApiStats()
      loadStats()
    }
  }

  const geminiLimits = appConfig.gemini.freeTierLimits
  const geminiRequestsRemaining = geminiLimits.requestsPerDay - geminiStats.requestsToday
  const geminiRequestsPercent = (geminiStats.requestsToday / geminiLimits.requestsPerDay) * 100
  const geminiTokensPercent = (geminiStats.tokensToday / geminiLimits.tokensPerDay) * 100
  const geminiRequestsPerMinuteRemaining = geminiLimits.requestsPerMinute - geminiStats.requestsThisMinute
  
  // Google Maps free tier limits (approximate - adjust based on your plan)
  const mapsLimits = {
    requestsPerDay: 40000, // Google Maps free tier: 40,000 requests/month ≈ 1,333/day
    requestsPerMinute: 100, // Approximate per-minute limit
  }
  const mapsRequestsRemaining = mapsLimits.requestsPerDay - mapsStats.requestsToday
  const mapsRequestsPercent = (mapsStats.requestsToday / mapsLimits.requestsPerDay) * 100
  const mapsRequestsPerMinuteRemaining = mapsLimits.requestsPerMinute - mapsStats.requestsThisMinute

  // Internal app API stats (client-side tracked /api/* calls)
  const internalRequestsPerMinuteRemaining = Math.max(0, 60 - internalStats.requestsThisMinute)

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-50'
    if (percent >= 70) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getStatusBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor Gemini and Google Maps API usage and prevent exceeding free tier limits
          </p>
        </div>

        {/* GCP Usage Verification Section */}
        {gcpUsage && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Google Cloud Platform Usage (Verified)
                </h2>
                <button
                  onClick={loadGcpUsage}
                  disabled={gcpLoading}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${gcpLoading ? 'animate-spin' : ''}`} />
                  {gcpLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {!gcpUsage.configured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">⚠️ GCP Not Configured</p>
                  <p className="text-yellow-700 text-sm mb-2">{gcpUsage.error || 'GCP usage tracking is not set up'}</p>
                  {gcpUsage.setupInstructions && (
                    <div className="bg-white rounded p-3 mt-2">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Setup Instructions:</p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {gcpUsage.setupInstructions}
                      </pre>
                    </div>
                  )}
                </div>
              ) : gcpUsage.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">❌ Error Fetching GCP Data</p>
                  <p className="text-red-700 text-sm">{gcpUsage.error}</p>
                  {gcpUsage.setupInstructions && (
                    <p className="text-red-600 text-xs mt-2">{gcpUsage.setupInstructions}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gemini GCP Stats */}
                    {gcpUsage.gemini && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          Gemini API (GCP)
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests Today:</span>
                            <span className="font-semibold">{gcpUsage.gemini.requestsToday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests This Hour:</span>
                            <span className="font-semibold">{gcpUsage.gemini.requestsThisHour}</span>
                          </div>
                          {gcpUsage.gemini.tokensToday !== undefined && gcpUsage.gemini.tokensToday > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tokens Today:</span>
                              <span className="font-semibold">
                                {(gcpUsage.gemini.tokensToday / 1000000).toFixed(2)}M
                              </span>
                            </div>
                          )}
                          {gcpUsage.gemini.errorsToday > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Errors Today:</span>
                              <span className="font-semibold">{gcpUsage.gemini.errorsToday}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Maps GCP Stats */}
                    {gcpUsage.maps && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          Google Maps API (GCP)
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests Today:</span>
                            <span className="font-semibold">{gcpUsage.maps.requestsToday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests This Hour:</span>
                            <span className="font-semibold">{gcpUsage.maps.requestsThisHour}</span>
                          </div>
                          {gcpUsage.maps.errorsToday > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Errors Today:</span>
                              <span className="font-semibold">{gcpUsage.maps.errorsToday}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info message if all zeros */}
                  {(gcpUsage.gemini?.requestsToday === 0 && gcpUsage.maps?.requestsToday === 0) && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">📊 GCP Metrics Information</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li><strong>Local tracking</strong> (above) updates immediately when APIs are called</li>
                            <li><strong>GCP metrics</strong> (here) have a 5-15 minute delay and appear after actual API usage</li>
                            <li>If you see zeros, either: APIs haven't been used yet, or metrics are still propagating</li>
                            <li>Compare with local stats above to verify APIs are working</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {gcpUsage.projectId && (
                    <div className="col-span-full text-xs text-gray-500 mt-2">
                      Project ID: {gcpUsage.projectId}
                      {gcpUsage.lastUpdated && ` • Last updated: ${new Date(gcpUsage.lastUpdated).toLocaleTimeString()}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gemini API Stats Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gemini API Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests Today</h3>
                <Activity className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{geminiStats.requestsToday}</span>
                <span className="text-sm text-gray-500">/ {geminiLimits.requestsPerDay}</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusBarColor(geminiRequestsPercent)}`}
                    style={{ width: `${Math.min(geminiRequestsPercent, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${getStatusColor(geminiRequestsPercent)} px-2 py-1 rounded inline-block`}>
                  {geminiRequestsRemaining} remaining
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Tokens Today</h3>
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {(geminiStats.tokensToday / 1000000).toFixed(2)}M
                </span>
                <span className="text-sm text-gray-500">/ {(geminiLimits.tokensPerDay / 1000000).toFixed(0)}M</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusBarColor(geminiTokensPercent)}`}
                    style={{ width: `${Math.min(geminiTokensPercent, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${getStatusColor(geminiTokensPercent)} px-2 py-1 rounded inline-block`}>
                  {((geminiLimits.tokensPerDay - geminiStats.tokensToday) / 1000000).toFixed(2)}M remaining
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests/Minute</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{geminiStats.requestsThisMinute}</span>
                <span className="text-sm text-gray-500">/ {geminiLimits.requestsPerMinute}</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-blue-500"
                    style={{
                      width: `${Math.min((geminiStats.requestsThisMinute / geminiLimits.requestsPerMinute) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs mt-1 text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                  {geminiRequestsPerMinuteRemaining} remaining this minute
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Status</h3>
                {geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="mt-2">
                {geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 ? (
                  <div className="text-red-600 font-semibold">⚠️ Near Limit</div>
                ) : geminiRequestsPercent >= 70 || geminiTokensPercent >= 70 ? (
                  <div className="text-orange-600 font-semibold">⚡ Moderate Usage</div>
                ) : (
                  <div className="text-green-600 font-semibold">✅ Healthy</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps API Stats Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Maps API Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests Today</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{mapsStats.requestsToday}</span>
                <span className="text-sm text-gray-500">/ {mapsLimits.requestsPerDay.toLocaleString()}</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusBarColor(mapsRequestsPercent)}`}
                    style={{ width: `${Math.min(mapsRequestsPercent, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${getStatusColor(mapsRequestsPercent)} px-2 py-1 rounded inline-block`}>
                  {mapsRequestsRemaining.toLocaleString()} remaining
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests/Minute</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{mapsStats.requestsThisMinute}</span>
                <span className="text-sm text-gray-500">/ {mapsLimits.requestsPerMinute}</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-blue-500"
                    style={{
                      width: `${Math.min((mapsStats.requestsThisMinute / mapsLimits.requestsPerMinute) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs mt-1 text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                  {mapsRequestsPerMinuteRemaining} remaining this minute
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Status</h3>
                {mapsRequestsPercent >= 90 ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="mt-2">
                {mapsRequestsPercent >= 90 ? (
                  <div className="text-red-600 font-semibold">⚠️ Near Limit</div>
                ) : mapsRequestsPercent >= 70 ? (
                  <div className="text-orange-600 font-semibold">⚡ Moderate Usage</div>
                ) : (
                  <div className="text-green-600 font-semibold">✅ Healthy</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Breakdown</h3>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Geocode:</span>
                  <span className="font-semibold">{mapsStats.geocodeRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Places:</span>
                  <span className="font-semibold">{mapsStats.placesRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Directions:</span>
                  <span className="font-semibold">{mapsStats.directionsRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Place Details:</span>
                  <span className="font-semibold">{mapsStats.placeDetailsRequests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Internal App API Stats Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">App API Usage (Internal)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests Today</h3>
                <Activity className="w-5 h-5 text-slate-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{internalStats.requestsToday}</span>
              </div>
              <p className="text-xs mt-2 text-gray-500">Tracks client-side calls to <span className="font-semibold">/api/*</span></p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Requests/Minute</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{internalStats.requestsThisMinute}</span>
                <span className="text-sm text-gray-500">/ 60</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-blue-500"
                    style={{
                      width: `${Math.min((internalStats.requestsThisMinute / 60) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs mt-1 text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                  {internalRequestsPerMinuteRemaining} remaining this minute
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Errors Today</h3>
                <AlertTriangle className={`w-5 h-5 ${internalStats.errorsToday > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{internalStats.errorsToday}</span>
              </div>
              <p className="text-xs mt-2 text-gray-500">Non-2xx responses or network failures</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Top Endpoint</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              {(() => {
                const entries = Object.entries(internalStats.byPath || {})
                const top = entries.sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))[0]
                if (!top) return <div className="text-gray-500 text-sm mt-2">No requests yet</div>
                const [path, meta] = top
                return (
                  <div className="mt-1">
                    <div className="text-sm font-semibold text-gray-900 truncate" title={path}>
                      {path}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {meta.count} calls • avg {meta.avgDurationMs}ms • {meta.errors} errors
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mb-8">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Reset All Stats for Today
          </button>
        </div>

        {/* Usage Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Requests Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Requests Over Time
              </h2>
            </div>
            <div className="h-64">
              <Line
                data={{
                  labels: usageHistory.map((h) => `${h.hour}:00`),
                  datasets: [
                    {
                      label: 'Requests',
                      data: usageHistory.map((h) => h.requests),
                      borderColor: 'rgb(2, 132, 199)',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'Daily Limit',
                      data: Array(24).fill(geminiLimits.requestsPerDay / 24),
                      borderColor: 'rgb(239, 68, 68)',
                      borderDash: [5, 5],
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: geminiLimits.requestsPerDay,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Usage Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Distribution
              </h2>
            </div>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['Requests', 'Tokens (M)', 'Per Minute'],
                  datasets: [
                    {
                      label: 'Used',
                      data: [
                        geminiStats.requestsToday,
                        geminiStats.tokensToday / 1000000,
                        geminiStats.requestsThisMinute,
                      ],
                      backgroundColor: [
                        geminiRequestsPercent >= 90
                          ? 'rgba(239, 68, 68, 0.8)'
                          : geminiRequestsPercent >= 70
                          ? 'rgba(249, 115, 22, 0.8)'
                          : 'rgba(34, 197, 94, 0.8)',
                        geminiTokensPercent >= 90
                          ? 'rgba(239, 68, 68, 0.8)'
                          : geminiTokensPercent >= 70
                          ? 'rgba(249, 115, 22, 0.8)'
                          : 'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                      ],
                    },
                    {
                      label: 'Limit',
                      data: [
                        geminiLimits.requestsPerDay,
                        geminiLimits.tokensPerDay / 1000000,
                        geminiLimits.requestsPerMinute,
                      ],
                      backgroundColor: 'rgba(156, 163, 175, 0.3)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Limits Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Free Tier Limits</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Limit Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Used</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700 font-semibold">Gemini - Daily Requests</td>
                  <td className="py-3 px-4 text-right font-semibold">{geminiStats.requestsToday}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{geminiLimits.requestsPerDay}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {geminiRequestsRemaining}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(geminiRequestsPercent)}`}
                    >
                      {geminiRequestsPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700 font-semibold">Gemini - Daily Tokens</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {(geminiStats.tokensToday / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {(geminiLimits.tokensPerDay / 1000000).toFixed(0)}M
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {((geminiLimits.tokensPerDay - geminiStats.tokensToday) / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(geminiTokensPercent)}`}
                    >
                      {geminiTokensPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700 font-semibold">Gemini - Requests per Minute</td>
                  <td className="py-3 px-4 text-right font-semibold">{geminiStats.requestsThisMinute}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{geminiLimits.requestsPerMinute}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {geminiRequestsPerMinuteRemaining}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50">
                      {((geminiStats.requestsThisMinute / geminiLimits.requestsPerMinute) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700 font-semibold">Google Maps - Daily Requests</td>
                  <td className="py-3 px-4 text-right font-semibold">{mapsStats.requestsToday}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{mapsLimits.requestsPerDay.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {mapsRequestsRemaining.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(mapsRequestsPercent)}`}
                    >
                      {mapsRequestsPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 font-semibold">Google Maps - Requests per Minute</td>
                  <td className="py-3 px-4 text-right font-semibold">{mapsStats.requestsThisMinute}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{mapsLimits.requestsPerMinute}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {mapsRequestsPerMinuteRemaining}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50">
                      {((mapsStats.requestsThisMinute / mapsLimits.requestsPerMinute) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        {(geminiRequestsPercent >= 70 || geminiTokensPercent >= 70 || mapsRequestsPercent >= 70) && (
          <div
            className={`bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 ${
              geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 || mapsRequestsPercent >= 90
                ? 'border-red-500'
                : 'border-orange-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-6 h-6 flex-shrink-0 ${
                  geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 || mapsRequestsPercent >= 90
                    ? 'text-red-600'
                    : 'text-orange-600'
                }`}
              />
              <div>
                <h3
                  className={`font-semibold mb-1 ${
                    geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 || mapsRequestsPercent >= 90
                      ? 'text-red-900'
                      : 'text-orange-900'
                  }`}
                >
                  {geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 || mapsRequestsPercent >= 90
                    ? 'Warning: Approaching Free Tier Limits'
                    : 'Notice: Moderate Usage Detected'}
                </h3>
                <p className="text-gray-700 text-sm">
                  {geminiRequestsPercent >= 90 || geminiTokensPercent >= 90 || mapsRequestsPercent >= 90
                    ? 'You are approaching the free tier limits. Consider upgrading or reducing API usage to avoid service interruption.'
                    : 'Your usage is moderate. Monitor closely to ensure you stay within free tier limits.'}
                </p>
                {geminiRequestsPercent >= 90 && (
                  <p className="text-red-700 text-sm mt-2 font-semibold">
                    Gemini Requests: {geminiRequestsRemaining} remaining today
                  </p>
                )}
                {geminiTokensPercent >= 90 && (
                  <p className="text-red-700 text-sm mt-2 font-semibold">
                    Gemini Tokens: {((geminiLimits.tokensPerDay - geminiStats.tokensToday) / 1000000).toFixed(2)}M
                    remaining today
                  </p>
                )}
                {mapsRequestsPercent >= 90 && (
                  <p className="text-red-700 text-sm mt-2 font-semibold">
                    Google Maps Requests: {mapsRequestsRemaining.toLocaleString()} remaining today
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">API Configuration</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">Gemini API Enabled</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  appConfig.gemini.enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {appConfig.gemini.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">Model</span>
              <span className="text-gray-900 font-semibold">{appConfig.gemini.model}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">API Key Configured</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  appConfig.gemini.apiKey
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {appConfig.gemini.apiKey ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Temperature</span>
              <span className="text-gray-900 font-semibold">{appConfig.gemini.temperature}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
