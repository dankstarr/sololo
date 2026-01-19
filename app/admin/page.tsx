'use client'

import { useState, useEffect } from 'react'
import { getUsageStats, resetUsageStats } from '@/lib/api/gemini'
import appConfig from '@/config/app.config'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  Activity,
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

export default function AdminPanel() {
  const [stats, setStats] = useState<UsageStats>({
    requestsToday: 0,
    tokensToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
  })
  const [usageHistory, setUsageHistory] = useState<Array<{ hour: number; requests: number }>>([])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Generate hourly usage data for the last 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date().getHours() - (23 - i)
      const adjustedHour = hour < 0 ? hour + 24 : hour
      return {
        hour: adjustedHour,
        requests: Math.floor(Math.random() * 5) + Math.floor(stats.requestsToday / 24),
      }
    })
    setUsageHistory(hours)
  }, [stats.requestsToday])

  const loadStats = () => {
    const currentStats = getUsageStats()
    setStats(currentStats)
    loadUsageHistory()
  }

  const loadUsageHistory = () => {
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
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset today\'s usage stats?')) {
      resetUsageStats()
      loadStats()
    }
  }

  const limits = appConfig.gemini.freeTierLimits
  const requestsRemaining = limits.requestsPerDay - stats.requestsToday
  const requestsPercent = (stats.requestsToday / limits.requestsPerDay) * 100
  const tokensPercent = (stats.tokensToday / limits.tokensPerDay) * 100
  const requestsPerMinuteRemaining = limits.requestsPerMinute - stats.requestsThisMinute

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
            Monitor Gemini API usage and prevent exceeding free tier limits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Requests Today</h3>
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{stats.requestsToday}</span>
              <span className="text-sm text-gray-500">/ {limits.requestsPerDay}</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStatusBarColor(requestsPercent)}`}
                  style={{ width: `${Math.min(requestsPercent, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${getStatusColor(requestsPercent)} px-2 py-1 rounded inline-block`}>
                {requestsRemaining} remaining
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
                {(stats.tokensToday / 1000000).toFixed(2)}M
              </span>
              <span className="text-sm text-gray-500">/ {(limits.tokensPerDay / 1000000).toFixed(0)}M</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStatusBarColor(tokensPercent)}`}
                  style={{ width: `${Math.min(tokensPercent, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${getStatusColor(tokensPercent)} px-2 py-1 rounded inline-block`}>
                {((limits.tokensPerDay - stats.tokensToday) / 1000000).toFixed(2)}M remaining
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Requests/Minute</h3>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{stats.requestsThisMinute}</span>
              <span className="text-sm text-gray-500">/ {limits.requestsPerMinute}</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all bg-blue-500"
                  style={{
                    width: `${Math.min((stats.requestsThisMinute / limits.requestsPerMinute) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs mt-1 text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                {requestsPerMinuteRemaining} remaining this minute
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Status</h3>
              {requestsPercent >= 90 || tokensPercent >= 90 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="mt-2">
              {requestsPercent >= 90 || tokensPercent >= 90 ? (
                <div className="text-red-600 font-semibold">⚠️ Near Limit</div>
              ) : requestsPercent >= 70 || tokensPercent >= 70 ? (
                <div className="text-orange-600 font-semibold">⚡ Moderate Usage</div>
              ) : (
                <div className="text-green-600 font-semibold">✅ Healthy</div>
              )}
            </div>
            <button
              onClick={handleReset}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Today
            </button>
          </div>
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
                      data: Array(24).fill(limits.requestsPerDay / 24),
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
                      max: limits.requestsPerDay,
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
                        stats.requestsToday,
                        stats.tokensToday / 1000000,
                        stats.requestsThisMinute,
                      ],
                      backgroundColor: [
                        requestsPercent >= 90
                          ? 'rgba(239, 68, 68, 0.8)'
                          : requestsPercent >= 70
                          ? 'rgba(249, 115, 22, 0.8)'
                          : 'rgba(34, 197, 94, 0.8)',
                        tokensPercent >= 90
                          ? 'rgba(239, 68, 68, 0.8)'
                          : tokensPercent >= 70
                          ? 'rgba(249, 115, 22, 0.8)'
                          : 'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                      ],
                    },
                    {
                      label: 'Limit',
                      data: [
                        limits.requestsPerDay,
                        limits.tokensPerDay / 1000000,
                        limits.requestsPerMinute,
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
                  <td className="py-3 px-4 text-gray-700">Daily Requests</td>
                  <td className="py-3 px-4 text-right font-semibold">{stats.requestsToday}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{limits.requestsPerDay}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {requestsRemaining}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(requestsPercent)}`}
                    >
                      {requestsPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Daily Tokens</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {(stats.tokensToday / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {(limits.tokensPerDay / 1000000).toFixed(0)}M
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {((limits.tokensPerDay - stats.tokensToday) / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(tokensPercent)}`}
                    >
                      {tokensPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Requests per Minute</td>
                  <td className="py-3 px-4 text-right font-semibold">{stats.requestsThisMinute}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{limits.requestsPerMinute}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    {requestsPerMinuteRemaining}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50">
                      {((stats.requestsThisMinute / limits.requestsPerMinute) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        {(requestsPercent >= 70 || tokensPercent >= 70) && (
          <div
            className={`bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 ${
              requestsPercent >= 90 || tokensPercent >= 90
                ? 'border-red-500'
                : 'border-orange-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-6 h-6 flex-shrink-0 ${
                  requestsPercent >= 90 || tokensPercent >= 90
                    ? 'text-red-600'
                    : 'text-orange-600'
                }`}
              />
              <div>
                <h3
                  className={`font-semibold mb-1 ${
                    requestsPercent >= 90 || tokensPercent >= 90
                      ? 'text-red-900'
                      : 'text-orange-900'
                  }`}
                >
                  {requestsPercent >= 90 || tokensPercent >= 90
                    ? 'Warning: Approaching Free Tier Limits'
                    : 'Notice: Moderate Usage Detected'}
                </h3>
                <p className="text-gray-700 text-sm">
                  {requestsPercent >= 90 || tokensPercent >= 90
                    ? 'You are approaching the free tier limits. Consider upgrading or reducing API usage to avoid service interruption.'
                    : 'Your usage is moderate. Monitor closely to ensure you stay within free tier limits.'}
                </p>
                {requestsPercent >= 90 && (
                  <p className="text-red-700 text-sm mt-2 font-semibold">
                    Requests: {requestsRemaining} remaining today
                  </p>
                )}
                {tokensPercent >= 90 && (
                  <p className="text-red-700 text-sm mt-2 font-semibold">
                    Tokens: {((limits.tokensPerDay - stats.tokensToday) / 1000000).toFixed(2)}M
                    remaining today
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
