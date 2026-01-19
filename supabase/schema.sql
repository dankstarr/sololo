-- Sololo Supabase schema (apply in Supabase SQL editor)
-- Notes:
-- - This app currently writes via server routes using SUPABASE_SERVICE_ROLE_KEY.
-- - You can enable RLS later when Supabase Auth is integrated.

create extension if not exists pgcrypto;

-- Shared itineraries (public link sharing)
create table if not exists public.shared_itineraries (
  id text primary key,
  trip jsonb not null,
  locations jsonb not null default '[]'::jsonb,
  itinerary jsonb not null,
  views integer not null default 0,
  created_at timestamptz not null default now()
);

-- Trips (user created)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id text null,
  destination text not null,
  days integer not null,
  start_date date null,
  end_date date null,
  interests text[] not null default '{}'::text[],
  travel_mode text not null,
  pace text not null,
  accessibility boolean not null default false,
  created_at timestamptz not null default now()
);

-- Location snapshot per trip (keeps the exact data shown to user)
create table if not exists public.trip_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  position integer not null default 0,
  location jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_locations_trip_id_idx on public.trip_locations(trip_id);

-- Itinerary snapshot per trip
create table if not exists public.trip_itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  days jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_itineraries_trip_id_idx on public.trip_itineraries(trip_id);

-- Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  created_by text null,
  trip_id uuid null references public.trips(id) on delete set null,
  name text null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  member_count integer not null default 1,
  max_members integer not null default 10,
  interests text[] not null default '{}'::text[],
  description text null,
  created_at timestamptz not null default now()
);

create index if not exists groups_destination_idx on public.groups(destination);

-- Group membership (optional)
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id text not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

-- Cached top-location search results (e.g. "around me")
create table if not exists public.top_location_results (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null,
  mode text not null, -- e.g. 'around'
  params jsonb not null,
  locations jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists top_location_results_cache_key_idx
  on public.top_location_results(cache_key, mode, created_at desc);

-- Optional: enable RLS later (recommended once auth is in place)
-- alter table public.trips enable row level security;
-- alter table public.trip_locations enable row level security;
-- alter table public.trip_itineraries enable row level security;
-- alter table public.groups enable row level security;
-- alter table public.group_members enable row level security;
-- alter table public.shared_itineraries enable row level security;
--
-- Example public read policy for shared itineraries:
-- create policy "public read shared itineraries"
--   on public.shared_itineraries for select
--   using (true);

