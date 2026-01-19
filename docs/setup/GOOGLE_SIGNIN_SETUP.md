# Google Sign-In Setup Guide

This guide will help you set up Google Sign-In authentication for Sololo using Supabase Auth.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- A Google Cloud Platform account (for OAuth credentials)

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`
   - Add test users if your app is in testing mode
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Sololo Web App`
   - Authorized redirect URIs: Add these:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - `http://localhost:3001/api/auth/callback` (for local development)
     - `https://yourdomain.com/api/auth/callback` (for production)
7. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure Google Provider in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to configure
4. Enable the Google provider
5. Enter your **Client ID** and **Client Secret** from Google Cloud Console
6. Click **Save**

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (required for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Existing Supabase variables (for server-side operations)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Where to find these values:

- **NEXT_PUBLIC_SUPABASE_URL**: Found in Supabase Dashboard → Settings → API → Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Found in Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **SUPABASE_SERVICE_ROLE_KEY**: Found in Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

## Step 4: Update Redirect URLs

Make sure your redirect URLs match:

1. **In Google Cloud Console**: Add your Supabase callback URL:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

2. **In Supabase Dashboard**: Go to **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:3001` (for local dev) or your production URL
   - Redirect URLs: Add:
     - `http://localhost:3001/api/auth/callback`
     - `https://yourdomain.com/api/auth/callback` (for production)

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3001/app/home`

3. Click **"Continue with Google"** in the welcome banner or onboarding screen

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to `/app/home`

## Troubleshooting

### "Missing Supabase environment variables" warning

- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`
- Restart your dev server after adding environment variables

### "redirect_uri_mismatch" error

- Check that the redirect URI in Google Cloud Console matches exactly: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or extra characters

### User profile not syncing

- Check browser console for errors
- Verify the `/api/users/profile` endpoint is working
- Check Supabase logs in the dashboard

### Session not persisting

- Make sure cookies are enabled in your browser
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set
- Clear browser cache and try again

## Production Deployment

When deploying to production (e.g., Vercel):

1. Add all environment variables in your hosting platform's dashboard
2. Update Google Cloud Console redirect URIs to include your production domain
3. Update Supabase URL Configuration with your production domain
4. Test the sign-in flow in production

## Security Notes

- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose to the browser (it's public)
- Row Level Security (RLS) policies in Supabase protect your data
