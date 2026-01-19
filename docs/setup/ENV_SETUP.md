# Environment Variables Setup

## Quick Setup

Create a `.env.local` file in the root directory with the following content (replace the placeholder values with your **real** keys, but never commit those real keys to Git):

```env
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
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

## Verification

After creating `.env.local` and restarting the server, you can verify the key is loaded by:
1. Opening the browser console
2. Checking that Google Maps loads in the MapView component
3. No errors about missing API key

## Security Note

- `.env.local` is already in `.gitignore` and will not be committed to git
- Never commit API keys to version control
- For production, set environment variables in your hosting platform (Vercel, etc.)
