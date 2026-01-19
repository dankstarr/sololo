# Environment Variables Setup

## Quick Setup

Create a `.env.local` file in the root directory with the following content (replace the placeholder values with your **real** keys, but never commit those real keys to Git):

```env
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Persistence & Authentication)
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Cloud Platform (for API usage monitoring - optional)
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Steps to Create .env.local

1. In the root directory of your project (`/Users/yxx492/Documents/projects/sololo/`), create a new file named `.env.local`
2. Copy and paste the content above
3. Save the file
4. Restart your Next.js dev server (`npm run dev`)

## Current API Keys (Security-Friendly)

> Important: Never commit real API keys to the repository. Use placeholders locally and set real values only in `.env.local` and in your hosting platform (e.g., Vercel Project Settings → Environment Variables).

### Google Maps API
- **Env var**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Used in**: `config/google-maps.ts`
- **Accessed via**: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Gemini AI API
- **Env var**: `NEXT_PUBLIC_GEMINI_API_KEY`
- **Used in**: `config/gemini.ts`
- **Accessed via**: `process.env.NEXT_PUBLIC_GEMINI_API_KEY`

### Supabase (Persistence)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Used in**: `lib/supabase/*`, server routes under `app/api/*`
- **Accessed via**: `process.env.SUPABASE_URL`, `process.env.SUPABASE_SERVICE_ROLE_KEY`
- **Security**: `SUPABASE_SERVICE_ROLE_KEY` must remain server-only (never `NEXT_PUBLIC_*`)

### Google Cloud Platform (API Usage Monitoring - Optional)
- **Env vars**: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **Used in**: `app/api/admin/gcp-usage/route.ts` (admin dashboard)
- **Purpose**: Fetch real API usage data from Google Cloud Monitoring
- **Security**: `GOOGLE_APPLICATION_CREDENTIALS_JSON` must remain server-only (never `NEXT_PUBLIC_*`)

## Verification

After creating `.env.local` and restarting the server, you can verify the key is loaded by:
1. Opening the browser console
2. Checking that Google Maps loads in the MapView component
3. No errors about missing API key

## Security Note

- `.env.local` is already in `.gitignore` and will not be committed to git
- Never commit API keys to version control
- For production, set environment variables in your hosting platform (Vercel, etc.)
