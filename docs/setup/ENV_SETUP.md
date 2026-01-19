# Environment Variables Setup

## Quick Setup

Create a `.env.local` file in the root directory with the following content:

```env
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCXF2lDYV3Siobpg_zHISKP2aTBmLV8668

# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBe2lUFOBEHhNkGce-lPPYy0-b48GyKu6o
```

## Steps to Create .env.local

1. In the root directory of your project (`/Users/yxx492/Documents/projects/sololo/`), create a new file named `.env.local`
2. Copy and paste the content above
3. Save the file
4. Restart your Next.js dev server (`npm run dev`)

## Current API Keys

### Google Maps API
- **Key**: `AIzaSyCXF2lDYV3Siobpg_zHISKP2aTBmLV8668`
- **Used in**: `config/google-maps.ts`
- **Accessed via**: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Gemini AI API
- **Key**: `AIzaSyBe2lUFOBEHhNkGce-lPPYy0-b48GyKu6o`
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
