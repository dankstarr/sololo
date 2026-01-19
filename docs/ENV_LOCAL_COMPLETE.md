# Complete .env.local Template

## Clean Template (No Comments)

Copy this to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=false
ADMIN_EMAILS=
NEXT_PUBLIC_ADMIN_EMAILS=
NEXT_PUBLIC_GEMINI_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
NEXT_PUBLIC_APP_URL=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS_JSON=
GOOGLE_APPLICATION_CREDENTIALS=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
EMAIL_DOMAIN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NODE_ENV=
```

## Quick Start (Minimum Required)

If you just want to get started quickly, use only these required variables:

```env
# REQUIRED - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# REQUIRED - Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# REQUIRED - Admin Access
ADMIN_EMAILS=your-email@example.com
```

## Variable Reference

### Required Variables (Must Fill)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console → Maps APIs → Credentials |
| `ADMIN_EMAILS` | Admin email addresses | Your email address |

### Optional Variables (Can Initialize Later)

#### Google Maps (Optional)
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` - Map ID for Advanced Markers
- `NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK` - Use legacy markers (`true`/`false`)

#### Gemini AI (Optional but Recommended)
- `NEXT_PUBLIC_GEMINI_API_KEY` - Client-side Gemini key
- `GEMINI_API_KEY` - Server-only Gemini key (recommended)
- `GEMINI_MODEL` - Override default model

#### App Configuration (Optional)
- `NEXT_PUBLIC_APP_URL` - Your app URL (defaults to `http://localhost:3000`)

#### Admin (Optional)
- `NEXT_PUBLIC_ADMIN_EMAILS` - Client-side admin check

#### Google Cloud Platform (Optional)
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account JSON
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account file

#### Email (Optional)
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Email sender address
- `EMAIL_DOMAIN` - Email domain
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

#### Environment (Optional)
- `NODE_ENV` - Node environment (usually auto-set)

## Default Values

If you leave optional variables empty, the app will use these defaults:

- `NEXT_PUBLIC_APP_URL` → `http://localhost:3000` (dev) or your production URL
- `NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK` → `false`
- `GEMINI_MODEL` → `gemini-2.5-flash-lite`
- `RESEND_FROM_EMAIL` → `Sololo <noreply@sololo.com>`
- `NODE_ENV` → `development` (auto-set by Next.js)

## Security Notes

### Variables with `NEXT_PUBLIC_` prefix:
- ✅ **Exposed to browser** - Anyone can see these
- ✅ **Safe:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ⚠️ **Restrict:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (restrict in Google Console)
- ⚠️ **Consider server-side:** `NEXT_PUBLIC_GEMINI_API_KEY` (use `GEMINI_API_KEY` instead)

### Variables WITHOUT `NEXT_PUBLIC_` prefix:
- 🔒 **Server-only** - Never exposed to browser
- 🔒 **Keep secret:** `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `ADMIN_EMAILS`, `RESEND_API_KEY`, `SMTP_PASS`

## Example: Fully Configured

Here's an example with all optional variables filled:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=abc123def456
NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=false

# Admin
ADMIN_EMAILS=admin@example.com,another@example.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another@example.com

# Gemini AI (server-side recommended)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash-lite

# App Config
NEXT_PUBLIC_APP_URL=https://sololo.app

# GCP Monitoring
GOOGLE_CLOUD_PROJECT_ID=my-gcp-project
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Email
RESEND_API_KEY=re_abc123...
RESEND_FROM_EMAIL=Sololo <noreply@sololo.app>
EMAIL_DOMAIN=sololo.app
```

## Tips

1. **Start minimal:** Only fill required variables first, add optional ones as needed
2. **Use server-side keys:** Prefer `GEMINI_API_KEY` over `NEXT_PUBLIC_GEMINI_API_KEY`
3. **Restrict API keys:** Always restrict `NEXT_PUBLIC_*` keys in Google Cloud Console
4. **Never commit:** `.env.local` is already in `.gitignore` ✅
5. **Production:** Set all variables in your hosting platform (Vercel, etc.)

## Need Help?

- See `docs/ENV_SETUP_COMPLETE.md` for setup guide
- See `docs/ENV_VARIABLES_COMPLETE.md` for detailed explanations
- Check console for validation errors/warnings
