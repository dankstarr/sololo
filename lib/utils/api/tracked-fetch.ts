import { recordInternalApiCall } from '@/lib/utils/api/usage'

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  // Request
  return input.url
}

function toPath(url: string): string {
  try {
    // Absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const u = new URL(url)
      return u.pathname + (u.search || '')
    }
    // Relative URL
    const u = new URL(url, 'http://local')
    return u.pathname + (u.search || '')
  } catch {
    return url
  }
}

/**
 * trackedFetch records stats for internal Next.js API calls ("/api/*") on the client.
 * It does not change the request/response behavior.
 */
export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = toUrlString(input)
  const method = init?.method || (typeof input !== 'string' && 'method' in input ? (input as Request).method : 'GET')

  const shouldTrack = typeof window !== 'undefined' && url.startsWith('/api/')
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()

  try {
    const res = await fetch(input as any, init)
    if (shouldTrack) {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
      recordInternalApiCall({
        path: toPath(url),
        method,
        status: res.status,
        ok: res.ok,
        durationMs: end - start,
      })
    }
    return res
  } catch (err) {
    if (shouldTrack) {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
      recordInternalApiCall({
        path: toPath(url),
        method,
        status: 0,
        ok: false,
        durationMs: end - start,
      })
    }
    throw err
  }
}

