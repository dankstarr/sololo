# Security & Authentication Guide

## Overview

This document describes the authentication and authorization system implemented in Sololo to protect sensitive operations and user data.

## Authentication System

### Client-Side Authentication
- Uses Supabase Auth for user authentication
- Supports Google OAuth and email/password authentication
- Session managed via cookies and localStorage
- Hook: `useAuth()` provides authentication state and methods

### Server-Side Authentication
- Server-side session verification via Supabase
- Utilities in `lib/auth/server.ts` for API route protection
- Middleware functions for requiring authentication/admin access

## Protected Routes

### Admin Routes (Admin Only)

**Protected with `withAdmin()` wrapper:**

1. `/api/admin/config` - Page configuration management
   - GET, POST, PUT - All require admin access
   - Stores page settings and feature flags

2. `/api/admin/gcp-usage` - GCP usage metrics
   - GET - Requires admin access
   - Fetches Google Cloud Platform usage data

**Admin Panel Pages:**
- `/admin` - Full admin dashboard
  - Protected by `AdminLayout` component
  - Checks authentication and admin status
  - Redirects unauthorized users

### User-Specific Routes (Authenticated Users)

**Protected with `withAuth()` wrapper:**

1. `/api/users/profile` - User profile management
   - GET - Users can only view their own profile (admins can view any)
   - POST - Users can only update their own profile
   - DELETE - Users can only delete their own account

### Public Routes (No Authentication Required)

These routes are intentionally public for functionality:
- `/api/cities` - GET, POST (public read/search)
- `/api/share` - Public sharing functionality
- `/api/top-locations` - Public location discovery
- `/api/cache/*` - Public caching endpoints

**Note:** DELETE operations on `/api/cities` require admin access.

## Admin Access Control

### Configuration

Admin access is controlled via environment variable:

```env
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

**Development Mode:**
- If `ADMIN_EMAILS` is not set, all authenticated users have admin access
- This allows easy development without configuration

**Production Mode:**
- If `ADMIN_EMAILS` is not set, NO users have admin access
- Must explicitly configure admin emails

### Admin Functions

1. **View admin panel** (`/admin`)
2. **Manage page configuration** (edit marketing content, app settings)
3. **View GCP usage metrics**
4. **Delete cities and locations** (via `/api/cities` DELETE)
5. **View any user profile** (via `/api/users/profile` GET)

## Authorization Checks

### User Data Ownership

Users can only access/modify their own data:
- Profile updates require matching `userId`
- Saved items are scoped to user ID
- Trips are associated with user ID

### Admin Override

Admins can:
- View any user's profile
- Access admin-only endpoints
- Perform destructive operations (delete cities, etc.)

## Security Utilities

### Server-Side (`lib/auth/server.ts`)

```typescript
// Get current session (returns null if not authenticated)
const auth = await getServerSession()

// Require authentication (returns 401 if not authenticated)
const auth = await requireAuth()

// Require admin access (returns 403 if not admin)
const auth = await requireAdmin()

// Check if user is admin
const isAdmin = await isAdmin(userId)

// Verify resource ownership
const ownsResource = verifyOwnership(resourceUserId, currentUserId)

// Wrapper for authenticated routes
export const GET = withAuth(async (req, auth) => {
  // auth.user and auth.session available
})

// Wrapper for admin-only routes
export const GET = withAdmin(async (req, auth) => {
  // Only admins can access
})
```

### Client-Side (`lib/auth/client.ts`)

```typescript
// Check if current user is admin
const isAdmin = await checkIsAdmin()

// Require authentication (returns false if not authenticated)
const authenticated = await requireClientAuth()
```

## Implementation Examples

### Protecting an API Route

```typescript
import { withAuth } from '@/lib/auth/server'

async function handleGet(req: NextRequest, auth: { user: any; session: any }) {
  // auth.user.id contains the authenticated user's ID
  const userId = auth.user.id
  
  // Your logic here
  return NextResponse.json({ data: 'protected data' })
}

export const GET = withAuth(handleGet)
```

### Protecting Admin Route

```typescript
import { withAdmin } from '@/lib/auth/server'

async function handleDelete(req: NextRequest, auth: { user: any; session: any }) {
  // Only admins can access this
  // Your admin logic here
  return NextResponse.json({ success: true })
}

export const DELETE = withAdmin(handleDelete)
```

### Protecting Client Component

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/app')
    }
  }, [loading, isAuthenticated, router])

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>
  }

  return <div>Protected content</div>
}
```

## Environment Variables

### Required for Authentication

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Access (optional - see Admin Access Control above)
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

## Security Best Practices

1. **Always verify authentication server-side**
   - Client-side checks are for UX only
   - Server-side checks are mandatory

2. **Use environment variables for secrets**
   - Never commit API keys or secrets
   - Use `.env.local` for local development

3. **Validate user ownership**
   - Always check `userId` matches authenticated user
   - Use `verifyOwnership()` utility

4. **Protect destructive operations**
   - DELETE operations should require admin or explicit ownership
   - Add confirmation dialogs for destructive actions

5. **Rate limiting** (Future enhancement)
   - Consider adding rate limiting for API routes
   - Protect against abuse and DoS attacks

6. **Input validation**
   - Validate all user inputs
   - Sanitize data before database operations
   - Use TypeScript types for type safety

## Current Security Status

### ✅ Implemented

- [x] Admin panel authentication check
- [x] Admin API routes protected
- [x] User profile routes protected
- [x] User data ownership verification
- [x] Admin access control via environment variable
- [x] Session management via Supabase
- [x] Client-side auth hooks

### 🔄 Recommended Enhancements

- [ ] Rate limiting on API routes
- [ ] CSRF protection
- [ ] API key authentication for service-to-service calls
- [ ] Audit logging for admin actions
- [ ] Two-factor authentication (2FA)
- [ ] Role-based access control (RBAC) system
- [ ] IP whitelisting for admin access
- [ ] Session timeout and refresh

## Troubleshooting

### "Access Denied" on Admin Panel

1. Check if you're logged in
2. Verify your email is in `ADMIN_EMAILS` environment variable
3. Check browser console for errors
4. Verify Supabase authentication is working

### "Authentication Required" on API Routes

1. Ensure you're logged in
2. Check if session cookies are being sent
3. Verify Supabase environment variables are set
4. Check server logs for authentication errors

### Admin Access Not Working

1. Set `ADMIN_EMAILS` environment variable
2. Restart development server after changing env vars
3. Verify email matches exactly (case-sensitive)
4. Check `lib/auth/server.ts` `isAdmin()` function

## Support

For security issues or questions, please refer to:
- Supabase Auth documentation: https://supabase.com/docs/guides/auth
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
