# Deploying Sololo to Vercel via GitHub

## Quick Start (Recommended: Vercel Dashboard)

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **"Add New Project"** or **"Import Project"**
3. Select **"Import Git Repository"**
4. Choose **"GitHub"** as your Git provider
5. Authorize Vercel to access your GitHub account (if needed)
6. Select your repository: **`wasimekram/sololo`**
7. Click **"Import"**

### Step 2: Configure Project Settings

Vercel will auto-detect Next.js. Configure:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build` (auto-detected)

**Output Directory:** `.next` (auto-detected)

**Install Command:** `npm install` (auto-detected)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:**
- Add these for **Production**, **Preview**, and **Development** environments
- Get your Google Maps API key from: https://console.cloud.google.com/google/maps-apis
- Get your Gemini API key from: https://makersuite.google.com/app/apikey

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-3 minutes)
3. Your app will be live at: `https://sololo.vercel.app` (or your custom domain)

### Step 5: Automatic Deployments

✅ **Automatic:** Every push to `main` branch will trigger a new deployment
✅ **Preview:** Pull requests get preview deployments automatically
✅ **Custom Domain:** Add your domain in Project Settings → Domains

## Alternative: Deploy via Vercel CLI

If you prefer using CLI:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (first time only)
vercel link

# Deploy to production
vercel --prod
```

## Environment Variables Reference

Required environment variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini AI API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test Google Maps functionality
- [ ] Test Gemini AI features
- [ ] Check build logs for any errors
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct build script

### API Keys Not Working
- Verify keys are added to Vercel environment variables
- Check that keys start with `NEXT_PUBLIC_` for client-side access
- Restart deployment after adding environment variables

### Map Not Loading
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check browser console for API errors
- Ensure Google Maps API is enabled in Google Cloud Console

## Repository Status

✅ **GitHub:** https://github.com/wasimekram/sololo.git
✅ **Vercel Config:** `vercel.json` is configured
✅ **Ready to Deploy:** All files are committed and pushed

## Next Steps After Deployment

1. **Set up custom domain** in Vercel project settings
2. **Enable Vercel Analytics** for performance monitoring
3. **Configure preview deployments** for pull requests
4. **Set up monitoring** and error tracking
