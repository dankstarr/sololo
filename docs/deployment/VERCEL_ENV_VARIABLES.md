# Vercel Environment Variables Setup

## Required Environment Variables

Your Sololo app requires the following environment variables to be set in Vercel:

### 1. Google Maps API Key
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Where to get it:**
- Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
- Create a new API key or use existing one
- Enable "Maps JavaScript API" and "Places API"

### 2. Gemini AI API Key
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Where to get it:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key

### 3. Google Cloud Platform Credentials (Optional - for API usage monitoring)
```
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

**Where to get it:**
- See [GCP Credentials Setup Guide](../setup/GCP_CREDENTIALS_SETUP.md) for detailed instructions
- Create a service account with `roles/monitoring.viewer` role
- Download the JSON key file
- Convert JSON to single-line string format

## How to Add Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to your project** on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **Sololo project**
3. Go to **Settings** → **Environment Variables**
4. For each variable:

   **Add Google Maps Key:**
   - **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Add Gemini Key:**
   - **Key**: `NEXT_PUBLIC_GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Add GCP Project ID (Optional):**
   - **Key**: `GOOGLE_CLOUD_PROJECT_ID`
   - **Value**: Your GCP project ID (e.g., `my-project-123456`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

   **Add GCP Service Account JSON (Optional):**
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Your entire service account JSON as a single-line string (see [GCP Credentials Setup](../setup/GCP_CREDENTIALS_SETUP.md))
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

5. **Redeploy** your project after adding variables:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

### Method 2: Via Vercel CLI

```bash
# Set environment variable for production
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production

# Set environment variable for preview
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY preview

# Set environment variable for development
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY development

# Repeat for Gemini key
vercel env add NEXT_PUBLIC_GEMINI_API_KEY production
vercel env add NEXT_PUBLIC_GEMINI_API_KEY preview
vercel env add NEXT_PUBLIC_GEMINI_API_KEY development

# Pull environment variables locally (optional)
vercel env pull .env.local
```

## Environment Variable Checklist

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` added to Production
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` added to Preview
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` added to Development
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` added to Production
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` added to Preview
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` added to Development
- [ ] `GOOGLE_CLOUD_PROJECT_ID` added (optional, for API usage monitoring)
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` added (optional, for API usage monitoring)
- [ ] Project redeployed after adding variables

## Important Notes

### Why `NEXT_PUBLIC_` prefix?
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Required for client-side API calls (Google Maps, Gemini)
- Never use this prefix for server-only secrets

### Security Best Practices

1. **Never commit** API keys to git (already in `.gitignore`)
2. **Use Vercel Environment Variables** for production
3. **Restrict API keys** in Google Cloud Console:
   - Set HTTP referrer restrictions for Maps API
   - Limit to your Vercel domain: `*.vercel.app`
   - Add your custom domain when ready
4. **Rotate keys** if they were ever exposed
5. **Monitor usage** in Google Cloud Console

### API Key Restrictions (Recommended)

**Google Maps API:**
```
Application restrictions: HTTP referrers
Allowed referrers:
  https://*.vercel.app/*
  https://yourdomain.com/*
  http://localhost:3001/*
```

**Gemini API:**
- No restrictions needed (server-side only)
- Or restrict by IP if using server-side only

## Verifying Environment Variables

After deployment, verify variables are loaded:

1. **Check build logs** in Vercel dashboard
2. **Test in browser console**:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Maps key loaded' : 'Maps key missing')
   console.log(process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Gemini key loaded' : 'Gemini key missing')
   ```
3. **Test functionality**:
   - Maps should load on map pages
   - AI features should work in itinerary generation

## Troubleshooting

### Variables not working?
- ✅ Ensure variables start with `NEXT_PUBLIC_`
- ✅ Redeploy after adding variables
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Verify values don't have extra spaces

### Maps not loading?
- Check API key is correct
- Verify Maps JavaScript API is enabled
- Check browser console for errors
- Verify HTTP referrer restrictions allow your domain

### Gemini API errors?
- Check API key is correct
- Verify API is enabled in Google AI Studio
- Check rate limits in admin panel (`/admin`)
- Review build logs for errors

## Quick Setup Script

For quick setup via CLI:

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Add variables (will prompt for values)
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_GEMINI_API_KEY

# Deploy
vercel --prod
```

## Next Steps

1. ✅ Add environment variables in Vercel dashboard
2. ✅ Redeploy your project
3. ✅ Test Google Maps functionality
4. ✅ Test Gemini AI features
5. ✅ Set up custom domain (optional)
6. ✅ Configure API key restrictions in Google Cloud
