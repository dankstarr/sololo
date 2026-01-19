# Quick Environment Variables Setup

## ⚠️ Error: "supabaseUrl is required"

If you're seeing this error, you need to set up your Supabase environment variables.

## Quick Fix (2 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Create `.env.local` File

In your project root (`/Users/yxx492/Documents/projects/sololo/`), create a file named `.env.local`:

```bash
# In your terminal, from the project root:
touch .env.local
```

### Step 3: Add Environment Variables

Open `.env.local` and add:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps (REQUIRED for maps to work)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App URL (Optional but recommended)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace the placeholder values with your actual keys!**

### Step 4: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Where to Find Each Value

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key (secret!) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services → Credentials |

## Verify It Works

After restarting, check:
1. ✅ No more "supabaseUrl is required" errors
2. ✅ App loads without crashes
3. ✅ Login page works (`/login`)

## Troubleshooting

**Still seeing errors?**
- Make sure `.env.local` is in the project root (same folder as `package.json`)
- Restart the dev server after adding variables
- Check for typos in variable names
- Make sure there are no spaces around the `=` sign

**File not found?**
- `.env.local` might be hidden (starts with a dot)
- Use `ls -la` to see hidden files
- Or create it manually in your editor

## Next Steps

Once environment variables are set:
1. ✅ Run `schema.sql` in Supabase SQL Editor
2. ✅ Run `enhancements.sql` in Supabase SQL Editor
3. ✅ Test creating a trip
4. ✅ Test login/signup

See `docs/setup/QUICK_DATABASE_SETUP.md` for database setup.
