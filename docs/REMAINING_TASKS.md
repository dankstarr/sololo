# Remaining Tasks & Action Items

## 🚨 Critical Actions Required (Before Production)

### 1. Environment Variables Setup
- [ ] **Create `.env.local` file** with all required variables
- [ ] **Set `ADMIN_EMAILS`** with your admin email address
- [ ] **Get Supabase keys** from Supabase Dashboard
- [ ] **Get Google Maps API key** from Google Cloud Console
- [ ] **Get Gemini API key** from Google AI Studio
- [ ] **Set production environment variables** in Vercel/hosting platform

**See:** `docs/ENV_SETUP_COMPLETE.md` for complete guide

---

### 2. API Key Security (Critical)

#### Google Maps API Key Restrictions
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
- [ ] Click on your API key
- [ ] Under "Application restrictions", select "HTTP referrers"
- [ ] Add your domains:
  - `https://yourdomain.com/*`
  - `https://*.vercel.app/*`
  - `http://localhost:3000/*` (dev only)

#### Move Gemini API to Server-Side (Recommended)
- [ ] Add `GEMINI_API_KEY` to `.env.local` (server-only, no `NEXT_PUBLIC_` prefix)
- [ ] Update client code to use `/api/proxy/gemini` endpoint instead of direct calls
- [ ] Remove `NEXT_PUBLIC_GEMINI_API_KEY` from client-side code (optional, but more secure)

**Current Status:** Proxy endpoint exists at `/api/proxy/gemini`, but client code may still use direct calls

---

### 3. Supabase Row Level Security (RLS)
- [ ] Go to Supabase Dashboard → Authentication → Policies
- [ ] Enable RLS on sensitive tables:
  - `user_profiles`
  - `trips`
  - `trip_locations`
  - `user_saved_items`
  - `user_saved_locations`
- [ ] Create policies for each table:
  ```sql
  -- Example: Users can only read their own profile
  CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
  
  -- Example: Users can only update their own profile
  CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
  ```

**Why:** Adds an extra layer of security at the database level

---

## ⚠️ Important Enhancements (Recommended)

### 4. Rate Limiting on Public Routes
**Current Status:** ✅ Rate limiting implemented, but only on protected routes

**Action Required:**
- [ ] Add rate limiting to public routes:
  - `/api/cities` (GET, POST)
  - `/api/share`
  - `/api/top-locations`
  - `/api/cache/*`
- [ ] Use Redis for distributed rate limiting in production (currently in-memory)

**Example:**
```typescript
// In app/api/cities/route.ts
export const GET = secureRoute(handleGet, {
  rateLimit: { maxRequests: 100, windowMs: 60 * 1000 },
})
```

---

### 5. Request Logging & Monitoring
**Action Required:**
- [ ] Log all admin actions (who did what, when)
- [ ] Log failed authentication attempts
- [ ] Monitor for suspicious patterns
- [ ] Set up alerts for unusual activity

**Implementation:**
- Create `lib/logging/admin-actions.ts` for admin action logging
- Add logging middleware to admin routes
- Consider using a service like Sentry or LogRocket

---

### 6. CSRF Protection Enhancement
**Current Status:** ✅ Basic protection via SameSite cookies and CORS

**Enhancement:**
- [ ] Add CSRF tokens for state-changing operations (POST, PUT, DELETE)
- [ ] Implement CSRF token generation and validation middleware

---

## 🔧 Code Improvements

### 7. Email Service Implementation
**Current Status:** ⚠️ Placeholder in `app/api/email/welcome/route.ts`

**Action Required:**
- [ ] Implement actual email sending (Resend, SendGrid, or SMTP)
- [ ] Set up email templates
- [ ] Test email delivery

**See:** `docs/setup/EMAIL_SETUP.md` for options

---

### 8. Update Client Code to Use Gemini Proxy
**Current Status:** Proxy endpoint exists, but client may still call Gemini directly

**Action Required:**
- [ ] Search codebase for direct Gemini API calls
- [ ] Replace with `/api/proxy/gemini` endpoint calls
- [ ] Remove `NEXT_PUBLIC_GEMINI_API_KEY` usage from client code

**Files to check:**
- `lib/api/gemini.ts` - May need to update to use proxy
- Any components that call Gemini directly

---

## 📊 Production Readiness Checklist

### Infrastructure
- [ ] Deploy to production (Vercel, etc.)
- [ ] Set all environment variables in hosting platform
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up custom domain (if applicable)
- [ ] Configure DNS records

### Security
- [ ] All API keys restricted in Google Cloud Console
- [ ] `ADMIN_EMAILS` set in production environment
- [ ] Supabase RLS enabled
- [ ] Security headers verified (already implemented ✅)
- [ ] Rate limiting tested

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Monitor API usage in admin panel
- [ ] Set up alerts for high usage or errors

### Testing
- [ ] Test authentication flow
- [ ] Test admin panel access
- [ ] Test API routes
- [ ] Test rate limiting
- [ ] Test error handling

---

## 📝 Documentation Updates Needed

### 9. Update Outdated Documentation
- [ ] Update `docs/SECURITY.md` - Rate limiting is now implemented (not "future enhancement")
- [ ] Update any docs that reference old security status
- [ ] Add production deployment guide

---

## 🎯 Quick Wins (Easy to Implement)

### 10. Add Rate Limiting to Public Routes
**Time:** ~30 minutes
**Impact:** High (prevents abuse)

### 11. Enable Supabase RLS
**Time:** ~1 hour
**Impact:** High (database-level security)

### 12. Restrict API Keys in Google Console
**Time:** ~15 minutes
**Impact:** High (prevents key theft)

### 13. Set ADMIN_EMAILS
**Time:** ~2 minutes
**Impact:** High (enables admin panel)

---

## 📋 Summary by Priority

### 🔴 Critical (Do Before Launch)
1. Set up `.env.local` with all required variables
2. Set `ADMIN_EMAILS` environment variable
3. Restrict Google Maps API key in Google Cloud Console
4. Enable Supabase RLS
5. Set production environment variables

### 🟡 Important (Do Soon)
6. Add rate limiting to public routes
7. Move Gemini API to server-side proxy
8. Implement email service
9. Add request logging

### 🟢 Nice to Have (Can Wait)
10. CSRF token enhancement
11. Redis for distributed rate limiting
12. Advanced monitoring and alerts
13. Update documentation

---

## ✅ Already Completed

- ✅ Security headers middleware
- ✅ Rate limiting infrastructure
- ✅ Input validation & sanitization
- ✅ Authentication & authorization
- ✅ Admin panel protection
- ✅ API key proxy endpoint (`/api/proxy/gemini`)
- ✅ Request size limits
- ✅ CORS protection
- ✅ Environment variable validation
- ✅ File access protection
- ✅ Security documentation

---

## 🆘 Need Help?

- **Environment Variables:** See `docs/ENV_SETUP_COMPLETE.md`
- **Security:** See `docs/SECURITY_HARDENING.md`
- **API Setup:** See `docs/setup/` directory
- **Deployment:** See `docs/deployment/` directory

---

**Last Updated:** December 2024
