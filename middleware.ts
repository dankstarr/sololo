import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders } from './lib/security/middleware'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  securityHeaders(response.headers)
  
  // Block access to sensitive files
  const pathname = request.nextUrl.pathname
  
  // Block access to .env files
  if (pathname.includes('.env')) {
    return new NextResponse('Not Found', { status: 404 })
  }
  
  // Block access to sensitive directories
  if (pathname.startsWith('/.git') || pathname.startsWith('/.next')) {
    return new NextResponse('Not Found', { status: 404 })
  }
  
  // Add security headers for API routes
  if (pathname.startsWith('/api/')) {
    // Additional API-specific headers
    response.headers.set('X-API-Version', '1.0')
    
    // CORS headers (restrictive)
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean)
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
