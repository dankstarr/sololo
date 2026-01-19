# Complete Environment Variables Reference

## Quick Checklist

Use this checklist to ensure you have all required variables:

### ✅ Required (App won't work without these)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- [ ] `ADMIN_EMAILS` - Admin email addresses (comma-separated)

### ⚠️ Highly Recommended

- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` OR `GEMINI_API_KEY` - For AI features
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` - For Advanced Markers
- [ ] `NEXT_PUBLIC_APP_URL` - For CORS and redirects

### 🔧 Optional (Advanced Features)

- [ ] `GOOGLE_CLOUD_PROJECT_ID` - For GCP usage monitoring
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` - For GCP monitoring
- [ ] `RESEND_API_KEY` - For email functionality
- [ ] `GEMINI_MODEL` - Override default Gemini model

## Detailed Variable List

### 1. Supabase (Required)

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (public, safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (SECRET - server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

**Security:** `SUPABASE_SERVICE_ROLE_KEY` must NEVER have `NEXT_PUBLIC_` prefix

---

### 2. Google Maps API (Required for Maps)

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

**Where to get:**
- Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
- Create API key or use existing
- Enable APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API

**Security:** Restrict this key in Google Cloud Console:
- Application restrictions: HTTP referrers
- Add: `https://yourdomain.com/*`, `https://*.vercel.app/*`, `http://localhost:3000/*`

**Optional:**
```env
# Map ID for Advanced Markers
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here

# Use fallback markers
NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=false
```

---

### 3. Gemini API (Required for AI Features)

**Option 1: Client-side (exposed to browser)**
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Option 2: Server-side (RECOMMENDED - more secure)**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
Then use `/api/proxy/gemini` endpoint instead of calling Gemini directly.

**Where to get:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create new API key

**Optional:**
```env
# Override default model
GEMINI_MODEL=gemini-2.5-flash-lite
```

---

### 4. Admin Access (Required for Admin Panel)

```env
# Server-side admin check
ADMIN_EMAILS=admin@example.com,another-admin@example.com

# Optional: Client-side admin check (for UI)
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

**Format:** Comma-separated email addresses

**Note:** 
- Development: If not set, all authenticated users have admin access
- Production: If not set, NO users have admin access (secure by default)

---

### 5. Google Cloud Platform (Optional - API Monitoring)

```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

**Where to get:**
- See `docs/setup/GCP_CREDENTIALS_SETUP.md`
- Create service account with `roles/monitoring.viewer` role
- Download JSON key file
- Convert to single-line string format

**Alternative (local dev only):**
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

### 6. App Configuration (Optional)

```env
# App URL for CORS, redirects, email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Defaults:** `http://localhost:3000` in development

---

### 7. Email Configuration (Optional)

```env
# Resend API Key
RESEND_API_KEY=re_your_key_here

# Email sender
RESEND_FROM_EMAIL=Sololo <noreply@sololo.com>

# Alternative: SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
```

**Where to get:**
- Resend: https://resend.com/api-keys
- SMTP: Your email provider settings

---

## Minimum Required Setup

For basic functionality, you need at minimum:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Maps (Required for maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# Admin Access (Required for admin panel)
ADMIN_EMAILS=your-email@example.com
```

---

## Security Checklist

Before deploying to production:

- [ ] All `NEXT_PUBLIC_*` keys are restricted in Google Cloud Console
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does NOT have `NEXT_PUBLIC_` prefix
- [ ] `ADMIN_EMAILS` is set with your admin email(s)
- [ ] Server-only keys (`GEMINI_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`) don't have `NEXT_PUBLIC_` prefix
- [ ] All keys are set in hosting platform (Vercel) environment variables
- [ ] `.env.local` is in `.gitignore` ✅

---

## Verification

After setting up `.env.local`:

1. **Restart dev server:** `npm run dev`
2. **Check console:** Should see validation warnings/errors if missing required vars
3. **Test features:**
   - Maps should load (if Maps key set)
   - AI features should work (if Gemini key set)
   - Admin panel should be accessible (if admin email matches)

---

## Example .env.local

See `.env.local.example` for a complete template with all variables and comments.

---

## Troubleshooting

### "Missing required environment variable"
- Check variable name matches exactly (case-sensitive)
- Ensure no extra spaces
- Restart dev server after adding variables

### "API key not working"
- Verify key is correct
- Check API is enabled in Google Cloud Console
- Verify restrictions allow your domain

### "Admin access denied"
- Check `ADMIN_EMAILS` includes your email
- Verify email matches exactly (case-sensitive)
- Restart server after changing `ADMIN_EMAILS`

---

## Last Updated
December 2024
