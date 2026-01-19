# Supabase Setup (Sololo)

Sololo persists **trips, selected locations, generated itineraries, groups**, and **shared itineraries** in Supabase.

### 1) Create a Supabase project

- Create a project in Supabase and grab:
  - **Project URL**
  - **Service role key** (server-only)

### 2) Apply the database schema

- In Supabase Dashboard → **SQL Editor**, run:
  - `supabase/schema.sql`

### 3) Configure environment variables

Add these to your `.env.local`:

- **`SUPABASE_URL`**: Your Supabase project URL
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key (server-only; do not expose to the browser)

Optional (useful later when adding Supabase Auth / browser client):

- **`NEXT_PUBLIC_SUPABASE_URL`**: same as `SUPABASE_URL`
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: anon public key

### 4) What gets stored

- **Trips**: `/api/trips` writes the current trip form data.
- **Locations**: `components/app/LocationSelection.tsx` persists the *included* locations (with lat/lng, tags, aiExplanation).
- **Itineraries**: stored as a JSON snapshot per trip.
- **Groups**: `/api/groups` persists created groups (optionally linked to a trip).
- **Share links**: `/api/share` stores a shareable itinerary in `shared_itineraries`.

