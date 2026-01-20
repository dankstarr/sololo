-- Supabase Integration Enhancements
-- Apply these after the base schema.sql for additional optimizations
--
-- ⚠️ SAFETY NOTE: Supabase may warn about "destructive operations"
-- This is SAFE - the DELETE statements are inside a function that won't run automatically.
-- Your data (trips, users, saved items) will NOT be deleted.
-- Only cache cleanup function contains DELETE (and it only runs if you call it manually).

-- ============================================================================
-- 1. DATABASE TRIGGERS - Auto-update updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Ensure all target tables actually have an updated_at column
alter table public.trips add column if not exists updated_at timestamptz not null default now();

-- Apply triggers to all tables with updated_at
create trigger update_trips_updated_at before update on public.trips
  for each row execute function update_updated_at_column();

create trigger update_cities_updated_at before update on public.cities
  for each row execute function update_updated_at_column();

create trigger update_city_locations_updated_at before update on public.city_locations
  for each row execute function update_updated_at_column();

create trigger update_geocode_cache_updated_at before update on public.geocode_cache
  for each row execute function update_updated_at_column();

create trigger update_destination_locations_cache_updated_at before update on public.destination_locations_cache
  for each row execute function update_updated_at_column();

create trigger update_place_details_cache_updated_at before update on public.place_details_cache
  for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at before update on public.user_profiles
  for each row execute function update_updated_at_column();

create trigger update_user_preferences_updated_at before update on public.user_preferences
  for each row execute function update_updated_at_column();

create trigger update_user_saved_items_updated_at before update on public.user_saved_items
  for each row execute function update_updated_at_column();

-- ============================================================================
-- 2. ADDITIONAL INDEXES - Performance optimization
-- ============================================================================

-- Indexes for trips queries
create index if not exists trips_user_id_idx on public.trips(user_id) where user_id is not null;
create index if not exists trips_destination_idx on public.trips(destination);
create index if not exists trips_created_at_idx on public.trips(created_at desc);

-- Indexes for groups queries
create index if not exists groups_created_by_idx on public.groups(created_by) where created_by is not null;
create index if not exists groups_created_at_idx on public.groups(created_at desc);
create index if not exists groups_start_date_idx on public.groups(start_date);

-- Indexes for user queries
create index if not exists user_profiles_is_pro_idx on public.user_profiles(is_pro);
create index if not exists user_profiles_created_at_idx on public.user_profiles(created_at desc);

-- Composite index for saved items queries
create index if not exists user_saved_items_user_type_saved_idx 
  on public.user_saved_items(user_id, item_type, is_saved) 
  where is_saved = true;

create index if not exists user_saved_items_user_type_liked_idx 
  on public.user_saved_items(user_id, item_type, is_liked) 
  where is_liked = true;

-- Index for shared itineraries views
create index if not exists shared_itineraries_views_idx on public.shared_itineraries(views desc);
create index if not exists shared_itineraries_created_at_idx on public.shared_itineraries(created_at desc);

-- ============================================================================
-- 3. DATABASE FUNCTIONS - Helper functions for common operations
-- ============================================================================

-- Function to get user's trip count
create or replace function get_user_trip_count(p_user_id text)
returns integer as $$
begin
  return (select count(*)::integer from public.trips where user_id = p_user_id);
end;
$$ language plpgsql stable;

-- Function to get user's favorites count
create or replace function get_user_favorites_count(p_user_id text)
returns integer as $$
begin
  return (
    select count(*)::integer 
    from public.user_saved_items 
    where user_id = p_user_id and (is_saved = true or is_liked = true)
  );
end;
$$ language plpgsql stable;

-- Function to increment shared itinerary views
create or replace function increment_shared_itinerary_views(p_id text)
returns void as $$
begin
  update public.shared_itineraries
  set views = views + 1
  where id = p_id;
end;
$$ language plpgsql;

-- Function to clean old cache entries (for maintenance)
-- NOTE: This function only deletes old CACHE entries, not your actual data (trips, users, etc.)
-- It will NOT run automatically - you must call it manually if needed
create or replace function clean_old_cache_entries()
returns void as $$
begin
  -- Delete geocode cache older than 1 year (cache only, not user data)
  delete from public.geocode_cache
  where updated_at < now() - interval '1 year';
  
  -- Delete destination locations cache older than 30 days (cache only)
  delete from public.destination_locations_cache
  where updated_at < now() - interval '30 days';
  
  -- Delete place details cache older than 1 year (cache only)
  delete from public.place_details_cache
  where updated_at < now() - interval '1 year';
  
  -- Delete top location results older than 30 days (cache only)
  delete from public.top_location_results
  where created_at < now() - interval '30 days';
end;
$$ language plpgsql;

-- NOTE: The DELETE statements above are SAFE because:
-- 1. They're inside a function that won't run automatically
-- 2. They only delete cache entries (temporary data), not your trips/users/saved items
-- 3. You must explicitly call this function for it to run: SELECT clean_old_cache_entries();

-- ============================================================================
-- 4. DATABASE VIEWS - Simplified queries
-- ============================================================================

-- View for user trip summary
create or replace view user_trip_summary as
select 
  t.user_id,
  count(t.id) as total_trips,
  count(distinct t.destination) as unique_destinations,
  max(t.created_at) as last_trip_date,
  array_agg(distinct t.destination) as destinations
from public.trips t
where t.user_id is not null
group by t.user_id;

-- View for popular destinations
create or replace view popular_destinations as
select 
  destination,
  count(*) as trip_count,
  count(distinct user_id) as user_count,
  max(created_at) as last_trip_date
from public.trips
where user_id is not null
group by destination
order by trip_count desc;

-- View for group summary
create or replace view group_summary as
select 
  g.id,
  g.name,
  g.destination,
  g.member_count,
  g.max_members,
  count(gm.id) as actual_member_count,
  g.created_at
from public.groups g
left join public.group_members gm on g.id = gm.group_id
group by g.id, g.name, g.destination, g.member_count, g.max_members, g.created_at;

-- ============================================================================
-- 5. FULL-TEXT SEARCH - For searching trips and locations
-- ============================================================================

-- Add full-text search columns
alter table public.trips add column if not exists search_vector tsvector;
alter table public.cities add column if not exists search_vector tsvector;

-- Function to update search vectors
create or replace function update_trip_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.destination, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.interests, ' '), '')), 'B');
  return new;
end;
$$ language plpgsql;

create or replace function update_city_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.country, '')), 'B');
  return new;
end;
$$ language plpgsql;

-- Triggers to update search vectors
create trigger update_trip_search_vector_trigger
  before insert or update on public.trips
  for each row execute function update_trip_search_vector();

create trigger update_city_search_vector_trigger
  before insert or update on public.cities
  for each row execute function update_city_search_vector();

-- Update existing rows
update public.trips set search_vector = 
  setweight(to_tsvector('english', coalesce(destination, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(array_to_string(interests, ' '), '')), 'B')
where search_vector is null;

update public.cities set search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(country, '')), 'B')
where search_vector is null;

-- Indexes for full-text search
create index if not exists trips_search_vector_idx on public.trips using gin(search_vector);
create index if not exists cities_search_vector_idx on public.cities using gin(search_vector);

-- ============================================================================
-- 6. ANALYTICS & USAGE TRACKING
-- ============================================================================

-- Table for tracking API usage and analytics
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id text null,
  event_type text not null, -- 'trip_created', 'location_saved', 'itinerary_shared', etc.
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

-- Table for tracking popular searches
create table if not exists public.search_analytics (
  id uuid primary key default gen_random_uuid(),
  search_query text not null,
  search_type text not null, -- 'destination', 'location', 'city'
  result_count integer not null default 0,
  user_id text null,
  created_at timestamptz not null default now()
);

create index if not exists search_analytics_query_idx on public.search_analytics(search_query);
create index if not exists search_analytics_type_idx on public.search_analytics(search_type);
create index if not exists search_analytics_created_at_idx on public.search_analytics(created_at desc);

-- ============================================================================
-- 7. CONSTRAINTS & VALIDATIONS
-- ============================================================================

-- Add check constraints for data validation
alter table public.trips add constraint trips_days_positive check (days > 0);
alter table public.trips add constraint trips_dates_valid check (
  start_date is null or end_date is null or start_date <= end_date
);

alter table public.groups add constraint groups_dates_valid check (start_date <= end_date);
alter table public.groups add constraint groups_member_count_valid check (
  member_count > 0 and member_count <= max_members
);

alter table public.user_saved_items add constraint user_saved_items_type_valid check (
  item_type in ('itinerary', 'audio_guide', 'route', 'location')
);

alter table public.cities add constraint cities_coordinates_valid check (
  lat >= -90 and lat <= 90 and lng >= -180 and lng <= 180
);

alter table public.city_locations add constraint city_locations_rating_valid check (
  rating is null or (rating >= 0 and rating <= 5)
);

-- ============================================================================
-- 8. SOFT DELETES (Optional - for data recovery)
-- ============================================================================

-- Add deleted_at columns for soft deletes
alter table public.trips add column if not exists deleted_at timestamptz null;
alter table public.groups add column if not exists deleted_at timestamptz null;
alter table public.user_profiles add column if not exists deleted_at timestamptz null;

-- Indexes for soft deletes
create index if not exists trips_deleted_at_idx on public.trips(deleted_at) where deleted_at is null;
create index if not exists groups_deleted_at_idx on public.groups(deleted_at) where deleted_at is null;
create index if not exists user_profiles_deleted_at_idx on public.user_profiles(deleted_at) where deleted_at is null;

-- ============================================================================
-- 9. MATERIALIZED VIEWS - For expensive aggregations
-- ============================================================================

-- Materialized view for destination statistics (refresh periodically)
create materialized view if not exists destination_stats as
select 
  destination,
  count(*) as total_trips,
  count(distinct user_id) as unique_users,
  avg(days) as avg_days,
  array_agg(distinct travel_mode) as travel_modes,
  array_agg(distinct pace) as paces,
  max(created_at) as last_trip_date
from public.trips
where deleted_at is null
group by destination;

create unique index if not exists destination_stats_destination_idx on destination_stats(destination);

-- Function to refresh materialized views
create or replace function refresh_materialized_views()
returns void as $$
begin
  refresh materialized view concurrently destination_stats;
end;
$$ language plpgsql;

-- ============================================================================
-- 10. COMMENTS - Documentation
-- ============================================================================

comment on table public.trips is 'User-created travel trips';
comment on table public.user_profiles is 'User profile information and subscription status';
comment on table public.user_saved_items is 'User saved and liked items (itineraries, guides, routes, locations)';
comment on table public.analytics_events is 'Analytics events for tracking user behavior';
comment on function get_user_trip_count(text) is 'Get the total number of trips for a user';
comment on function clean_old_cache_entries() is 'Clean up old cache entries (run periodically)';
