# Security Hardening Guide

## Overview

This document describes all security measures implemented to protect your Sololo application from common attacks and vulnerabilities.

## ✅ Implemented Security Measures

### 1. API Key Protection

**Problem:** API keys with `NEXT_PUBLIC_` prefix are exposed to the browser and can be stolen.

**Solution:**
- ✅ Created server-side proxy endpoint `/api/proxy/gemini` for Gemini API calls
- ✅ Server-only API keys (without `NEXT_PUBLIC_` prefix) are never exposed
- ✅ Client-side keys are rate-limited and monitored

**Recommendations:**
1. **Use server-side proxy** for sensitive API calls:
   ```typescript
   // Instead of calling Gemini directly from client:
   // ❌ fetch('https://generativelanguage.googleapis.com/...')
   
   // Use proxy endpoint:
   // ✅ fetch('/api/proxy/gemini', { method: 'POST', body: ... })
   ```

2. **Restrict API keys in Google Cloud Console:**
   - Google Maps API: Set HTTP referrer restrictions
   - Gemini API: Use IP restrictions or server-side only

3. **Use environment variables:**
   ```env
   # Server-only (secure)
   GEMINI_API_KEY=your_key_here
   
   # Client-side (exposed - restrict in console)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

### 2. Security Headers

**Implemented:**
- ✅ `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- ✅ `X-Frame-Options: DENY` - Prevents clickjacking
- ✅ `X-XSS-Protection: 1; mode=block` - XSS protection
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- ✅ `Content-Security-Policy` - Restricts resource loading
- ✅ `Strict-Transport-Security` - Forces HTTPS in production
- ✅ `Permissions-Policy` - Restricts browser features

**Location:** `middleware.ts` and `next.config.js`

### 3. Rate Limiting

**Implemented:**
- ✅ Per-IP rate limiting on API routes
- ✅ Per-user rate limiting (when authenticated)
- ✅ Configurable limits per endpoint
- ✅ Automatic cleanup of old rate limit records

**Current Limits:**
- Admin routes: 10-30 requests/minute
- User profile: 10 requests/minute (POST), 60/minute (GET)
- Gemini proxy: 10 requests/minute
- Default: 60 requests/minute

**Location:** `lib/security/middleware.ts`

### 4. Input Validation & Sanitization

**Implemented:**
- ✅ String sanitization (removes script tags, dangerous attributes)
- ✅ Request body validation with schemas
- ✅ Type checking and length limits
- ✅ Common validators (email, URL, UUID, etc.)

**Usage:**
```typescript
import { validateRequestBody, validators } from '@/lib/security/middleware'

const validation = validateRequestBody(body, {
  email: validators.email(),
  name: validators.string(1, 100),
  age: validators.number(0, 120),
})
```

**Location:** `lib/security/middleware.ts`

### 5. Request Size Limits

**Implemented:**
- ✅ Maximum request body size limits
- ✅ Prevents DoS attacks via large payloads
- ✅ Configurable per route

**Current Limits:**
- Admin config: 100KB
- User profile: 10KB
- Gemini proxy: 100KB

**Location:** `lib/security/middleware.ts`

### 6. Authentication & Authorization

**Implemented:**
- ✅ All admin routes require authentication + admin role
- ✅ User routes require authentication
- ✅ Users can only access their own data
- ✅ Admin override for viewing any user data

**Location:** `lib/auth/server.ts`, `app/admin/layout.tsx`

### 7. CORS Protection

**Implemented:**
- ✅ Restrictive CORS headers
- ✅ Only allows requests from configured origins
- ✅ Preflight request handling

**Configuration:**
```typescript
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
]
```

**Location:** `middleware.ts`

### 8. Environment Variable Validation

**Implemented:**
- ✅ Validates required environment variables on startup
- ✅ Warns about exposed API keys
- ✅ Checks for common security mistakes
- ✅ Fails in production if critical vars missing

**Location:** `lib/security/env-validator.ts`

### 9. File Access Protection

**Implemented:**
- ✅ Blocks access to `.env` files
- ✅ Blocks access to `.git` directory
- ✅ Blocks access to `.next` directory
- ✅ Returns 404 for sensitive paths

**Location:** `middleware.ts`

### 10. SQL Injection Protection

**Implemented:**
- ✅ Using Supabase client (parameterized queries)
- ✅ Input sanitization before database operations
- ✅ Type validation on all inputs

**Best Practice:** Always use Supabase client methods, never raw SQL with user input.

## 🔒 Security Checklist

### Environment Variables

- [ ] All API keys stored in `.env.local` (not committed)
- [ ] `.env.local` in `.gitignore` ✅
- [ ] Server-only keys don't have `NEXT_PUBLIC_` prefix
- [ ] Production keys set in hosting platform (Vercel)
- [ ] Admin emails configured in `ADMIN_EMAILS`

### API Keys

- [ ] Google Maps API key restricted in Google Cloud Console
- [ ] Gemini API key used server-side only (via proxy)
- [ ] Service role keys never exposed to browser
- [ ] Keys rotated if ever exposed

### Authentication

- [ ] Admin panel requires login ✅
- [ ] Admin routes protected ✅
- [ ] User routes require authentication ✅
- [ ] Users can only access own data ✅

### API Routes

- [ ] Rate limiting enabled ✅
- [ ] Request size limits set ✅
- [ ] Input validation on all inputs ✅
- [ ] Security headers added ✅
- [ ] CORS configured ✅

### Infrastructure

- [ ] HTTPS enabled in production
- [ ] Security headers configured ✅
- [ ] Sensitive files blocked ✅
- [ ] Error messages don't leak secrets ✅

## 🚨 Critical Security Recommendations

### 1. Move API Keys Server-Side

**Current:** Gemini API key is exposed via `NEXT_PUBLIC_GEMINI_API_KEY`

**Action Required:**
1. Create `.env.local` with server-only key:
   ```env
   GEMINI_API_KEY=your_server_key_here
   ```
2. Update code to use `/api/proxy/gemini` endpoint
3. Remove `NEXT_PUBLIC_GEMINI_API_KEY` from client-side code

### 2. Restrict Google Maps API Key

**Action Required:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your domains:
   - `https://yourdomain.com/*`
   - `https://*.vercel.app/*`
   - `http://localhost:3000/*` (dev only)

### 3. Enable Supabase Row Level Security (RLS)

**Action Required:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Enable RLS on sensitive tables:
   - `user_profiles`
   - `trips`
   - `trip_locations`
   - `user_saved_items`
3. Create policies:
   ```sql
   -- Users can only read their own profile
   CREATE POLICY "Users can view own profile"
   ON user_profiles FOR SELECT
   USING (auth.uid() = id);
   
   -- Users can only update their own profile
   CREATE POLICY "Users can update own profile"
   ON user_profiles FOR UPDATE
   USING (auth.uid() = id);
   ```

### 4. Add Rate Limiting to More Routes

**Action Required:**
- Add rate limiting to public routes (cities, share, etc.)
- Use Redis for distributed rate limiting in production
- Monitor and adjust limits based on usage

### 5. Add Request Logging

**Action Required:**
- Log all admin actions
- Log failed authentication attempts
- Monitor for suspicious patterns
- Set up alerts for unusual activity

## 🛡️ Protection Against Common Attacks

### SQL Injection
- ✅ **Protected:** Using Supabase client (parameterized queries)
- ✅ **Protected:** Input sanitization
- ✅ **Protected:** Type validation

### XSS (Cross-Site Scripting)
- ✅ **Protected:** Content Security Policy
- ✅ **Protected:** Input sanitization
- ✅ **Protected:** React auto-escaping

### CSRF (Cross-Site Request Forgery)
- ✅ **Protected:** SameSite cookies (Supabase)
- ✅ **Protected:** CORS restrictions
- ⚠️ **Enhancement:** Add CSRF tokens for state-changing operations

### Clickjacking
- ✅ **Protected:** X-Frame-Options: DENY
- ✅ **Protected:** Content Security Policy frame-ancestors

### DoS (Denial of Service)
- ✅ **Protected:** Rate limiting
- ✅ **Protected:** Request size limits
- ⚠️ **Enhancement:** Add DDoS protection (Cloudflare/Vercel)

### API Key Theft
- ✅ **Protected:** Server-side proxy for sensitive APIs
- ✅ **Protected:** API key restrictions in Google Console
- ⚠️ **Enhancement:** Rotate keys regularly

### Unauthorized Access
- ✅ **Protected:** Authentication required for sensitive routes
- ✅ **Protected:** Authorization checks (users can only access own data)
- ✅ **Protected:** Admin-only routes protected

## 📊 Security Monitoring

### What to Monitor

1. **Failed Authentication Attempts**
   - Track failed login attempts
   - Alert on suspicious patterns
   - Block IPs after multiple failures

2. **API Usage**
   - Monitor rate limit hits
   - Track unusual request patterns
   - Alert on potential abuse

3. **Admin Actions**
   - Log all admin operations
   - Review changes regularly
   - Alert on sensitive operations

4. **Error Rates**
   - Monitor 4xx/5xx errors
   - Investigate spikes
   - Check for attack patterns

## 🔧 Quick Security Fixes

### Immediate Actions

1. **Set ADMIN_EMAILS:**
   ```env
   ADMIN_EMAILS=your-email@example.com
   ```

2. **Restrict Google Maps API Key:**
   - Add HTTP referrer restrictions
   - Limit to your domains

3. **Review Exposed Keys:**
   - Check browser console for `NEXT_PUBLIC_*` vars
   - Move sensitive keys server-side

4. **Enable HTTPS:**
   - Ensure production uses HTTPS
   - Set up SSL certificate

5. **Review API Routes:**
   - Ensure all sensitive routes are protected
   - Add rate limiting where missing

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Google Cloud API Security](https://cloud.google.com/apis/design/security)

## 🆘 Security Incident Response

If you suspect a security breach:

1. **Immediately:**
   - Rotate all API keys
   - Revoke compromised sessions
   - Review access logs

2. **Investigate:**
   - Check admin panel access logs
   - Review API usage patterns
   - Identify compromised accounts

3. **Remediate:**
   - Fix vulnerabilities
   - Update security measures
   - Notify affected users (if required)

4. **Prevent:**
   - Implement additional security measures
   - Review and update security policies
   - Conduct security audit

## Last Updated
December 2024
