// Client-side API usage tracking (localStorage-backed)
// Used by /admin to display real-time usage and hourly history.

export interface HourlyUsagePoint {
  hour: number
  requests: number
}

export interface InternalApiStats {
  requestsToday: number
  requestsThisMinute: number
  lastRequestTime: number
  errorsToday: number
  byPath: Record<
    string,
    {
      count: number
      errors: number
      avgDurationMs: number
      lastStatus?: number
      lastDurationMs?: number
      lastMethod?: string
      lastSeenAt?: number
    }
  >
}

const INTERNAL_API_STATS_KEY = 'internal_api_usage_stats'

// Note: /admin currently reads this exact key name (historical accident).
// We store combined request volume (Gemini + Maps + internal /api/* calls) here so the chart is real.
const HOURLY_HISTORY_KEY_PREFIX = 'gemini_usage_history_'

function todayKey(prefix: string) {
  return `${prefix}${new Date().toDateString()}`
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function ensureHourlyArray(existing: unknown): HourlyUsagePoint[] {
  if (Array.isArray(existing) && existing.length === 24) {
    const ok = existing.every(
      (p) =>
        p &&
        typeof (p as any).hour === 'number' &&
        typeof (p as any).requests === 'number' &&
        (p as any).hour >= 0 &&
        (p as any).hour <= 23
    )
    if (ok) return existing as HourlyUsagePoint[]
  }

  // Default: 24 hours, zeroed
  return Array.from({ length: 24 }, (_, i) => ({ hour: i, requests: 0 }))
}

export function incrementHourlyUsage(count: number = 1, at: number = Date.now()) {
  if (typeof window === 'undefined') return

  const d = new Date(at)
  const key = todayKey(HOURLY_HISTORY_KEY_PREFIX)
  const saved = safeJsonParse<HourlyUsagePoint[]>(localStorage.getItem(key))
  const history = ensureHourlyArray(saved)

  const hour = d.getHours()
  const idx = history.findIndex((p) => p.hour === hour)
  if (idx >= 0) history[idx] = { hour, requests: history[idx].requests + count }

  localStorage.setItem(key, JSON.stringify(history))
}

function checkMinuteWindow(stats: { lastRequestTime: number; requestsThisMinute: number }) {
  const now = Date.now()
  if (!stats.lastRequestTime || now - stats.lastRequestTime > 60_000) {
    stats.requestsThisMinute = 0
    stats.lastRequestTime = now
  }
}

function loadInternalApiStats(): InternalApiStats {
  const empty: InternalApiStats = {
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    errorsToday: 0,
    byPath: {},
  }

  if (typeof window === 'undefined') return empty

  const parsed = safeJsonParse<{ date: string; stats: InternalApiStats }>(
    localStorage.getItem(INTERNAL_API_STATS_KEY)
  )
  if (!parsed) return empty

  const today = new Date().toDateString()
  if (parsed.date !== today) return empty

  return {
    ...empty,
    ...parsed.stats,
    byPath: parsed.stats?.byPath || {},
  }
}

function saveInternalApiStats(stats: InternalApiStats) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    INTERNAL_API_STATS_KEY,
    JSON.stringify({
      date: new Date().toDateString(),
      stats,
    })
  )
}

let internalApiStats: InternalApiStats = loadInternalApiStats()

export function recordInternalApiCall(params: {
  path: string
  method?: string
  status?: number
  ok: boolean
  durationMs?: number
}) {
  if (typeof window === 'undefined') return

  checkMinuteWindow(internalApiStats)
  internalApiStats.requestsToday++
  internalApiStats.requestsThisMinute++
  internalApiStats.lastRequestTime = Date.now()
  if (!params.ok) internalApiStats.errorsToday++

  const path = params.path || 'unknown'
  const prev =
    internalApiStats.byPath[path] || (internalApiStats.byPath[path] = { count: 0, errors: 0, avgDurationMs: 0 })

  prev.count++
  if (!params.ok) prev.errors++
  if (typeof params.durationMs === 'number' && Number.isFinite(params.durationMs)) {
    const nextAvg = prev.avgDurationMs
      ? prev.avgDurationMs + (params.durationMs - prev.avgDurationMs) / prev.count
      : params.durationMs
    prev.avgDurationMs = Math.round(nextAvg)
    prev.lastDurationMs = Math.round(params.durationMs)
  }

  if (typeof params.status === 'number') prev.lastStatus = params.status
  if (params.method) prev.lastMethod = params.method
  prev.lastSeenAt = Date.now()

  // Also power the /admin chart with real request volume
  incrementHourlyUsage(1)

  saveInternalApiStats(internalApiStats)
}

export function getInternalApiStats(): InternalApiStats {
  if (typeof window === 'undefined') {
    return {
      requestsToday: 0,
      requestsThisMinute: 0,
      lastRequestTime: 0,
      errorsToday: 0,
      byPath: {},
    }
  }
  // Keep minute window fresh even if user only watches /admin
  checkMinuteWindow(internalApiStats)
  return { ...internalApiStats, byPath: { ...internalApiStats.byPath } }
}

export function resetInternalApiStats() {
  internalApiStats = {
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    errorsToday: 0,
    byPath: {},
  }
  saveInternalApiStats(internalApiStats)
}

