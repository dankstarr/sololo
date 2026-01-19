import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/server'
import { secureRoute } from '@/lib/security/middleware'

// Admin configuration storage
// In production, this should be stored in Supabase or a database
// For now, we'll use a simple in-memory store (can be replaced with DB)

let adminConfig: Record<string, any> = {}

async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section')

  try {
    if (section) {
      return NextResponse.json({ 
        success: true, 
        data: adminConfig[section] || null 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: adminConfig 
    })
  } catch (error) {
    console.error('Error loading admin config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load config' },
      { status: 500 }
    )
  }
}

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const { section, data } = body

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section is required' },
        { status: 400 }
      )
    }

    adminConfig[section] = data

    return NextResponse.json({ 
      success: true, 
      message: 'Config saved successfully',
      data: adminConfig[section]
    })
  } catch (error) {
    console.error('Error saving admin config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save config' },
      { status: 500 }
    )
  }
}

async function handlePut(request: NextRequest) {
  try {
    const body = await request.json()
    const { section, updates } = body

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section is required' },
        { status: 400 }
      )
    }

    adminConfig[section] = {
      ...adminConfig[section],
      ...updates,
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Config updated successfully',
      data: adminConfig[section]
    })
  } catch (error) {
    console.error('Error updating admin config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update config' },
      { status: 500 }
    )
  }
}

// Helper to combine admin auth and security
function withAdminAndSecurity(
  handler: (req: NextRequest, auth: { user: any; session: any }) => Promise<NextResponse>,
  securityOptions: { rateLimit?: any; maxRequestSize?: number } = {}
) {
  const adminHandler = withAdmin(handler)
  return secureRoute(adminHandler, securityOptions)
}

// Export with admin protection and security middleware
export const GET = withAdminAndSecurity(handleGet, {
  rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
})
export const POST = withAdminAndSecurity(handlePost, {
  rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  maxRequestSize: 100 * 1024, // 100KB max
})
export const PUT = withAdminAndSecurity(handlePut, {
  rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  maxRequestSize: 100 * 1024, // 100KB max
})
