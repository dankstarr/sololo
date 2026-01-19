# Supabase Integration Verification Guide

## Quick Setup Checklist

### ✅ Step 1: Add Environment Variables

Add these to your `.env.local` file in the project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
- Go to your Supabase project dashboard
- **Settings** → **API**
- Copy the **Project URL** → `SUPABASE_URL`
- Copy the **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Never commit `.env.local` to git. The service role key has admin access.

### ✅ Step 2: Create Database Tables

1. Open Supabase Dashboard → **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run it
4. You should see: "Success. No rows returned"

This creates:
- `shared_itineraries` - for public share links
- `trips` - user-created trips
- `trip_locations` - location snapshots per trip
- `trip_itineraries` - itinerary snapshots per trip
- `groups` - travel groups
- `group_members` - group membership
- `top_location_results` - cached location search results

### ✅ Step 3: Verify Integration

**Option A: Test via API endpoint (recommended)**

1. Start your dev server: `npm run dev`
2. Open: `http://localhost:3001/api/test-supabase`
3. You should see JSON like:
   ```json
   {
     "success": true,
     "results": {
       "client": { "success": true, "message": "Supabase client initialized" },
       "shared_itineraries": { "success": true, "message": "Table accessible" },
       "trips": { "success": true, "message": "Table accessible" },
       "groups": { "success": true, "message": "Table accessible" },
       "top_location_results": { "success": true, "message": "Table accessible" }
     }
   }
   ```

**Option B: Test via app**

1. **Test trip creation:**
   - Go to `/app/home` → Create a trip → Select locations → Confirm
   - Check Supabase Dashboard → **Table Editor** → `trips` table
   - You should see a new row

2. **Test sharing:**
   - Go to `/app/itinerary` → Click "Share"
   - Check `shared_itineraries` table
   - You should see a new row with a share ID

3. **Test groups:**
   - Go to `/app/groups` → Create a group
   - Check `groups` table
   - You should see a new row

4. **Test location caching:**
   - Go to `/discover/locations` → Click "Around me"
   - Wait for results
   - Click "Around me" again (same location)
   - Should load instantly from cache (check `top_location_results` table)

## Troubleshooting

### ❌ "Missing Supabase URL" error
- Check `.env.local` has `SUPABASE_URL=...`
- Restart dev server after adding env vars

### ❌ "Missing SUPABASE_SERVICE_ROLE_KEY" error
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY=...`
- Restart dev server

### ❌ "relation does not exist" error
- Tables not created yet
- Run `supabase/schema.sql` in Supabase SQL Editor

### ❌ "permission denied" error
- Check you're using the **service_role** key (not anon key)
- Service role key bypasses RLS

### ❌ API returns 500 errors
- Check browser console and server logs
- Verify env vars are loaded (restart server)
- Check Supabase project is active (not paused)

## What Gets Stored Where

| Action | Table | When |
|--------|-------|------|
| Create trip | `trips` | After Location Selection confirm |
| Select locations | `trip_locations` | After Location Selection confirm |
| Generate itinerary | `trip_itineraries` | After Location Selection confirm |
| Share itinerary | `shared_itineraries` | When clicking "Share" button |
| Create group | `groups` | When creating a group |
| Search "around me" | `top_location_results` | First search caches results |

## Next Steps

Once verified:
- ✅ All data persists across page refreshes
- ✅ Shared itineraries work via `/discover/share/[id]`
- ✅ Groups load from database
- ✅ Location searches are cached for faster results
