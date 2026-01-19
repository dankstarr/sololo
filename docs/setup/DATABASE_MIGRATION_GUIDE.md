# Database Migration Guide - Step by Step

## Understanding the Files

### `schema.sql` - Base Database Schema
- **Purpose**: Creates all the core tables, indexes, and basic structure
- **Contains**: 
  - All tables (trips, user_profiles, shared_itineraries, etc.)
  - Basic indexes for performance
  - Foreign key relationships
- **Safe to run**: ✅ Yes - Uses `CREATE TABLE IF NOT EXISTS` so it won't overwrite existing tables

### `enhancements.sql` - Performance & Advanced Features
- **Purpose**: Adds optimizations, triggers, functions, and advanced features
- **Contains**:
  - Auto-update triggers for `updated_at` timestamps
  - Additional performance indexes
  - Helper functions (get_user_trip_count, etc.)
  - Database views for simplified queries
  - Full-text search capabilities
  - Analytics tables
  - Data validation constraints
  - Soft delete support
- **Safe to run**: ✅ Yes - Uses `CREATE OR REPLACE` and `IF NOT EXISTS` so it's safe

## ⚠️ Important: Do NOT Overwrite Your Database

**Both files are designed to be safe** - they use:
- `CREATE TABLE IF NOT EXISTS` - Won't recreate existing tables
- `CREATE OR REPLACE FUNCTION` - Safely updates functions
- `CREATE INDEX IF NOT EXISTS` - Won't duplicate indexes

**Your existing data will be preserved!**

## Step-by-Step Instructions for Supabase

### Step 1: Check What You Already Have

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Check Existing Tables**
   - Click **"Table Editor"** in the left sidebar
   - Note which tables already exist
   - Common ones you might have: `trips`, `user_profiles`, `shared_itineraries`

3. **Check Existing Functions**
   - Click **"Database"** → **"Functions"** in the left sidebar
   - See what functions exist

### Step 2: Apply Base Schema (schema.sql)

1. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button (top right)

2. **Copy schema.sql**
   - Open `supabase/schema.sql` from your project
   - Select all (Cmd+A / Ctrl+A)
   - Copy (Cmd+C / Ctrl+C)

3. **Paste into SQL Editor**
   - Paste into the SQL Editor window
   - You should see the full SQL script

4. **Run the Query**
   - Click **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for completion (usually 5-10 seconds)

5. **Check Results**
   - You should see: **"Success. No rows returned"** or similar
   - If you see errors, they're likely about existing tables (which is OK - the script handles this)
   - **Important**: If you see errors about missing extensions, see Step 4 below

6. **Verify Tables Created**
   - Go back to **"Table Editor"**
   - You should now see all these tables:
     - ✅ `shared_itineraries`
     - ✅ `trips`
     - ✅ `trip_locations`
     - ✅ `trip_itineraries`
     - ✅ `groups`
     - ✅ `group_members`
     - ✅ `group_invitations`
     - ✅ `user_profiles`
     - ✅ `user_preferences`
     - ✅ `user_saved_items`
     - ✅ `user_saved_locations`
     - ✅ `cities`
     - ✅ `city_locations`
     - ✅ `geocode_cache`
     - ✅ `destination_locations_cache`
     - ✅ `places_search_cache`
     - ✅ `place_details_cache`
     - ✅ `top_location_results`
     - ✅ `itinerary_collaborators`
     - ✅ `itinerary_edit_history`

### Step 3: Apply Enhancements (enhancements.sql)

1. **Open SQL Editor Again**
   - Click **"SQL Editor"** → **"New query"**

2. **Copy enhancements.sql**
   - Open `supabase/enhancements.sql` from your project
   - Select all and copy

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for completion (may take 10-20 seconds)

4. **Check Results**
   - Should see: **"Success. No rows returned"** or similar
   - Some warnings about existing objects are normal

5. **Verify Enhancements**
   - Go to **"Database"** → **"Functions"**
   - You should see functions like:
     - ✅ `update_updated_at_column()`
     - ✅ `get_user_trip_count()`
     - ✅ `get_user_favorites_count()`
   - Go to **"Database"** → **"Views"**
   - You should see views like:
     - ✅ `user_trip_summary`
     - ✅ `popular_destinations`
     - ✅ `group_summary`

### Step 4: Handle Common Issues

#### Issue: "extension pgcrypto does not exist"

**Solution:**
1. In SQL Editor, run this first:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```
2. Then run `schema.sql` again

#### Issue: "relation already exists" errors

**This is OK!** The scripts use `IF NOT EXISTS`, so existing tables won't be recreated. Your data is safe.

#### Issue: "permission denied"

**Solution:**
- Make sure you're logged into Supabase with the correct account
- If using a team project, ensure you have admin access
- Try running queries one section at a time

### Step 5: Verify Everything Works

1. **Test Database Connection**
   - Go to your app: `http://localhost:3000/api/test-supabase`
   - Should return success messages

2. **Test Creating a Trip**
   - Go to `/app/home`
   - Create a trip
   - Check Supabase **"Table Editor"** → `trips` table
   - Should see a new row

3. **Test User Profile**
   - Go to `/app/profile`
   - Check `user_profiles` table
   - Should see your profile

## What If I Already Have Data?

### ✅ Safe Scenarios (Your Data is Safe)

- **Tables already exist**: Scripts use `IF NOT EXISTS`, so nothing is overwritten
- **Some columns missing**: You can manually add them or the app will work with existing columns
- **Different table structure**: The app will work with what exists

### ⚠️ What to Watch For

- **Column name changes**: If the app expects a column that doesn't exist, you may need to add it manually
- **Missing indexes**: Performance might be slower, but functionality will work
- **Missing functions**: Some advanced features won't work, but core features will

## Recommended Approach

### Option A: Fresh Start (If No Important Data)

If you don't have important data yet:

1. Run `schema.sql` completely
2. Run `enhancements.sql` completely
3. Done!

### Option B: Incremental (If You Have Data)

If you have existing data you want to keep:

1. **First, check what you have** (Step 1 above)
2. **Run schema.sql** - It will create missing tables only
3. **Run enhancements.sql** - It will add missing features only
4. **Manually add any missing columns** if needed (see below)

### Option C: Manual Column Addition (If Needed)

If you need to add specific columns to existing tables:

```sql
-- Example: Add a column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN deleted_at timestamptz NULL;
  END IF;
END $$;
```

## Quick Reference: What Each File Does

### schema.sql Creates:
- ✅ All core tables
- ✅ Basic indexes
- ✅ Foreign key relationships
- ✅ User data tables

### enhancements.sql Adds:
- ✅ Auto-update triggers
- ✅ Performance indexes
- ✅ Helper functions
- ✅ Database views
- ✅ Full-text search
- ✅ Analytics tables
- ✅ Data validation
- ✅ Soft delete support

## Next Steps After Setup

1. ✅ Verify tables exist in Table Editor
2. ✅ Test creating a trip in the app
3. ✅ Check that data persists
4. ✅ Test profile page functionality
5. ✅ Test saving items

## Need Help?

If you encounter issues:
1. Check the error message in Supabase SQL Editor
2. Look at the Supabase logs (Dashboard → Logs)
3. Verify your environment variables are set correctly
4. Make sure your Supabase project is active (not paused)
