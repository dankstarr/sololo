# Complete Environment Variables Setup Guide

## 📋 Complete Checklist for .env.local

Copy this template to your `.env.local` file and fill in your actual values:

```env
# ============================================
# REQUIRED - Supabase (Authentication & Database)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ============================================
# REQUIRED - Google Maps API
# ============================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Map ID for Advanced Markers
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id_here

# ============================================
# REQUIRED - Gemini AI API
# ============================================
# Option 1: Client-side (exposed to browser)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Option 2: Server-only (RECOMMENDED - more secure)
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# REQUIRED - Admin Access
# ============================================
ADMIN_EMAILS=your-email@example.com

# ============================================
# OPTIONAL - App URL
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# OPTIONAL - Google Cloud Platform (API Monitoring)
# ============================================
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

## ✅ Required Variables (Minimum Setup)

These are **absolutely required** for the app to work:

1. **`NEXT_PUBLIC_SUPABASE_URL`** ⭐ REQUIRED
   - Your Supabase project URL
   - Get from: Supabase Dashboard → Settings → API

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** ⭐ REQUIRED
   - Supabase anonymous/public key
   - Get from: Supabase Dashboard → Settings → API

3. **`SUPABASE_SERVICE_ROLE_KEY`** ⭐ REQUIRED
   - Supabase service role key (SECRET - server-only)
   - Get from: Supabase Dashboard → Settings → API
   - ⚠️ **Never use `NEXT_PUBLIC_` prefix!**

4. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** ⭐ REQUIRED
   - Google Maps API key
   - Get from: Google Cloud Console → Maps APIs → Credentials
   - Enable: Maps JavaScript API, Places API

5. **`ADMIN_EMAILS`** ⭐ REQUIRED (for admin panel)
   - Comma-separated admin email addresses
   - Example: `admin@example.com,another@example.com`

## 🔧 Highly Recommended

6. **`NEXT_PUBLIC_GEMINI_API_KEY`** OR **`GEMINI_API_KEY`**
   - For AI itinerary generation
   - Get from: https://makersuite.google.com/app/apikey
   - **Recommendation:** Use `GEMINI_API_KEY` (server-only) with `/api/proxy/gemini`

7. **`NEXT_PUBLIC_APP_URL`**
   - Your app URL (for CORS, redirects)
   - Defaults to `http://localhost:3000` in dev
   - Set to your production domain in production

## 📝 Optional Variables

8. **`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`**
   - For Advanced Markers (better performance)
   - Get from: Google Cloud Console → Maps → Map Styles

9. **`GOOGLE_CLOUD_PROJECT_ID`**
   - For GCP usage monitoring in admin panel
   - Get from: Google Cloud Console

10. **`GOOGLE_APPLICATION_CREDENTIALS_JSON`**
    - Service account JSON for GCP monitoring
    - Get from: GCP Console → IAM → Service Accounts

11. **`GEMINI_MODEL`**
    - Override default Gemini model
    - Default: `gemini-2.5-flash-lite`

12. **`RESEND_API_KEY`** (if using email features)
    - For transactional emails
    - Get from: https://resend.com

## 🔒 Security Notes

### Variables with `NEXT_PUBLIC_` prefix:
- ✅ **Exposed to browser** - Anyone can see these
- ✅ **Safe:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ⚠️ **Restrict:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (restrict in Google Console)
- ⚠️ **Consider server-side:** `NEXT_PUBLIC_GEMINI_API_KEY` (use `GEMINI_API_KEY` instead)

### Variables WITHOUT `NEXT_PUBLIC_` prefix:
- 🔒 **Server-only** - Never exposed to browser
- 🔒 **Keep secret:** `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `ADMIN_EMAILS`

## 📍 Where to Get Each Key

### Supabase Keys
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep secret!**

### Google Maps API Key
1. Go to https://console.cloud.google.com/google/maps-apis
2. Credentials → Create Credentials → API Key
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. Restrict key (recommended):
   - Application restrictions → HTTP referrers
   - Add: `https://yourdomain.com/*`, `https://*.vercel.app/*`

### Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. **Recommended:** Use server-side only (no `NEXT_PUBLIC_` prefix)

### Admin Emails
- Just add your email: `ADMIN_EMAILS=your-email@example.com`
- Multiple admins: `ADMIN_EMAILS=admin1@example.com,admin2@example.com`

## ✅ Quick Setup Steps

1. **Create `.env.local` file** in project root
2. **Copy the template above** into `.env.local`
3. **Fill in your actual values** (get keys from links above)
4. **Restart dev server:** `npm run dev`
5. **Verify:** Check console for validation messages

## 🚨 Common Mistakes to Avoid

❌ **DON'T:**
- Use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`
- Commit `.env.local` to git (already in `.gitignore` ✅)
- Share API keys in screenshots or documentation
- Use production keys in development

✅ **DO:**
- Use server-only keys where possible (`GEMINI_API_KEY` instead of `NEXT_PUBLIC_GEMINI_API_KEY`)
- Restrict API keys in Google Cloud Console
- Set different keys for development and production
- Rotate keys if they're ever exposed

## 📊 Variable Status Check

After setting up, the app will automatically validate on startup. Check your console for:
- ✅ Green checkmarks = All good
- ⚠️ Warnings = Optional variables missing (app still works)
- ❌ Errors = Required variables missing (app won't work)

## Need Help?

- See `docs/ENV_VARIABLES_COMPLETE.md` for detailed explanations
- See `docs/setup/ENV_SETUP.md` for original setup guide
- Check console errors for specific missing variables
