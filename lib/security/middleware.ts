import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/server'

/**
 * Security headers middleware
 * Adds security headers to all responses
 */
export function securityHeaders(headers: Headers) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.googleapis.com https://*.supabase.co https://*.google.com wss://*.supabase.co",
    "frame-src 'self' https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
  
  headers.set('Content-Security-Policy', csp)
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
}

/**
 * Rate limiting store (in-memory)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  identifier?: (req: NextRequest) => string
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions) {
  return (req: NextRequest): NextResponse | null => {
    const { maxRequests, windowMs, identifier } = options
    
    // Get identifier (IP address or custom)
    const id = identifier 
      ? identifier(req)
      : req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        req.headers.get('x-real-ip') || 
        'unknown'
    
    const now = Date.now()
    const key = `${req.nextUrl.pathname}:${id}`
    const record = rateLimitStore.get(key)
    
    // Clean up old records periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k)
        }
      }
    }
    
    if (!record || record.resetTime < now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return null // Allow request
    }
    
    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          },
        }
      )
    }
    
    // Increment count
    record.count++
    rateLimitStore.set(key, record)
    
    return null // Allow request
  }
}

/**
 * Request size limit middleware
 */
export function requestSizeLimit(maxSizeBytes: number) {
  return (req: NextRequest): NextResponse | null => {
    const contentLength = req.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Request too large', message: `Request body exceeds ${maxSizeBytes} bytes` },
        { status: 413 }
      )
    }
    
    return null
  }
}

/**
 * Validate environment variables
 */
export function validateEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  
  const missing: string[] = []
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  // Warn about exposed API keys
  const exposedKeys = [
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  ]
  
  for (const key of exposedKeys) {
    if (process.env[key] && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️  Security Warning: ${key} is exposed to the browser. Consider using server-side proxy endpoints.`)
    }
  }
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove dangerous HTML attributes
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  return sanitized
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody(body: any, schema: Record<string, (value: any) => boolean>): { valid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = []
  const sanitized: any = {}
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = body[key]
    
    if (value === undefined) {
      errors.push(`Missing required field: ${key}`)
      continue
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
    
    if (!validator(sanitized[key])) {
      errors.push(`Invalid value for field: ${key}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Common validators
 */
export const validators = {
  string: (minLength = 0, maxLength = 1000) => (value: any) => 
    typeof value === 'string' && value.length >= minLength && value.length <= maxLength,
  
  email: () => (value: any) => 
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  number: (min = 0, max = Number.MAX_SAFE_INTEGER) => (value: any) =>
    typeof value === 'number' && value >= min && value <= max,
  
  array: (minLength = 0, maxLength = 100) => (value: any) =>
    Array.isArray(value) && value.length >= minLength && value.length <= maxLength,
  
  url: () => (value: any) => {
    if (typeof value !== 'string') return false
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  
  uuid: () => (value: any) =>
    typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
}

/**
 * Apply security middleware stack
 */
export function applySecurityMiddleware(
  req: NextRequest,
  options: {
    rateLimit?: RateLimitOptions
    maxRequestSize?: number
  } = {}
): NextResponse | null {
  // Request size limit
  if (options.maxRequestSize) {
    const sizeCheck = requestSizeLimit(options.maxRequestSize)(req)
    if (sizeCheck) return sizeCheck
  }
  
  // Rate limiting
  if (options.rateLimit) {
    const rateCheck = rateLimit(options.rateLimit)(req)
    if (rateCheck) return rateCheck
  }
  
  return null // All checks passed
}

/**
 * Create secure API route wrapper
 * Applies rate limiting, request size limits, and security headers
 * Use with withAuth/withAdmin wrappers for authentication
 */
export function secureRoute(
  handler: (req: NextRequest, auth?: { user: any; session: any }) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitOptions
    maxRequestSize?: number
  } = {}
) {
  return async (req: NextRequest, auth?: { user: any; session: any }) => {
    // Apply security middleware
    const securityCheck = applySecurityMiddleware(req, {
      rateLimit: options.rateLimit,
      maxRequestSize: options.maxRequestSize,
    })
    
    if (securityCheck) {
      return securityCheck
    }
    
    // Call handler
    const response = await handler(req, auth)
    
    // Add security headers
    securityHeaders(response.headers)
    
    return response
  }
}
