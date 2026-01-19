# Applying Supabase Schema

This guide explains how to apply the database schema to your Supabase project.

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Schema**
   - Open `supabase/schema.sql` in your project
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
   - Wait for the query to complete

5. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `shared_itineraries`
     - `trips`
     - `trip_locations`
     - `trip_itineraries`
     - `groups`
     - `group_members`
     - `top_location_results`
     - `cities` ⚠️ **Required for /api/cities**
     - `city_locations` ⚠️ **Required for /api/cities**
     - `geocode_cache` ⚠️ **Required for caching**
     - `destination_locations_cache` ⚠️ **Required for caching**
     - `places_search_cache` ⚠️ **Optional (for future use)**
     - `place_details_cache` ⚠️ **Required for caching**

## Important Notes

- The schema uses `CREATE TABLE IF NOT EXISTS`, so you can run it multiple times safely
- If you get errors, check that you have the correct permissions
- The `cities` and `city_locations` tables are optional but recommended for better performance
- All caching tables (`*_cache`) are recommended to reduce API costs

## Troubleshooting

### Error: "Could not find the table 'public.cities'"

This means the schema hasn't been applied yet. Follow the steps above to create the tables.

### Error: "permission denied"

Make sure you're using the SQL Editor with proper permissions, or use the Supabase CLI.

### Tables exist but API still fails

1. Check that environment variables are set correctly (`.env.local`)
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
3. Check the Supabase logs for detailed error messages

## Using Supabase CLI (Alternative)

If you prefer using the CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply schema
supabase db push
```

## What Gets Created

The schema creates:

1. **Core Tables**: Trips, locations, itineraries, groups
2. **Caching Tables**: Geocode, destination locations, place details
3. **City Tables**: Cities and city locations (optional but recommended)
4. **Indexes**: For fast queries on common fields

All tables are created in the `public` schema and are ready to use once applied.
