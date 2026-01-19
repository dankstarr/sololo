# Database Integration Guide

This document describes the complete Supabase database integration for Sololo, including all user data, preferences, and saved items.

## Overview

All user data is now stored in Supabase instead of localStorage, providing:
- **Persistence**: Data survives browser clears
- **Sync**: Data syncs across devices
- **Backup**: Data is backed up in the database
- **Scalability**: Ready for multi-user authentication

## Database Schema

### User Data Tables

1. **`user_profiles`** - User profile information
   - `id` (text, primary key) - User identifier
   - `name`, `email`, `avatar_url`, `bio`, `home_base`
   - `is_pro` - Subscription status
   - `itinerary_count`, `trips_created`, `favorites_count`
   - `created_at`, `updated_at`

2. **`user_preferences`** - User settings and preferences
   - `user_id` (references user_profiles)
   - `preferences` (jsonb) - Flexible JSON storage for settings

3. **`user_saved_items`** - Saved and liked items
   - `user_id`, `item_type`, `item_id`
   - `is_saved`, `is_liked` - Boolean flags
   - Supports: `itinerary`, `audio_guide`, `route`, `location`

4. **`user_saved_locations`** - Saved locations from discover page
   - `user_id`, `location_id`
   - `location_data` (jsonb) - Full location object for offline access

### Existing Tables (Already Integrated)

- `trips` - User trips
- `trip_locations` - Locations per trip
- `trip_itineraries` - Itineraries per trip
- `groups` - Travel groups
- `shared_itineraries` - Public shared itineraries
- `cities` - City data
- `city_locations` - Locations within cities
- All caching tables (`geocode_cache`, `destination_locations_cache`, etc.)

## API Routes

### User Profile
- `GET /api/users/profile?userId=...` - Get user profile
- `POST /api/users/profile` - Create/update user profile

### Saved Items
- `GET /api/users/saved-items?userId=...&type=...` - Get saved/liked items
- `POST /api/users/saved-items` - Toggle save/like status

### Saved Locations
- `GET /api/users/saved-locations?userId=...` - Get saved locations
- `POST /api/users/saved-locations` - Save a location
- `DELETE /api/users/saved-locations?userId=...&locationId=...` - Remove saved location

## Store Integration

The Zustand store (`useAppStore`) now syncs with Supabase:

### Automatic Sync
- On app mount, data syncs from DB to store
- When user toggles saved/liked items, changes sync to DB
- Profile updates sync to DB automatically

### Fallback Behavior
- If DB is unavailable, app falls back to localStorage
- Store works offline with cached data
- Changes queue up and sync when connection is restored

## Usage Examples

### Syncing User Data

```typescript
import { useAppStore } from '@/store/useAppStore'

function MyComponent() {
  const { syncFromDB, userProfile, savedItineraries } = useAppStore()
  
  // Manual sync (usually automatic on mount)
  const handleRefresh = async () => {
    await syncFromDB()
  }
}
```

### Toggling Saved Items

```typescript
const { toggleSavedItinerary } = useAppStore()

// This automatically syncs to DB
toggleSavedItinerary('itinerary-123')
```

### Saving Locations

```typescript
import { saveLocationToDB } from '@/lib/utils/user-sync'

await saveLocationToDB('user-1', 'location-123', locationData)
```

## Migration from localStorage

The app automatically migrates from localStorage to Supabase:

1. **On first load**: Store syncs from DB (creates default profile if needed)
2. **Saved items**: Loaded from DB, localStorage used as fallback
3. **Profile**: Loaded from DB, localStorage only stores user ID

## Benefits

1. **Data Persistence**: User data survives browser clears
2. **Cross-Device Sync**: Same account works on all devices
3. **Backup**: All data backed up in Supabase
4. **Performance**: Cached queries reduce DB load
5. **Scalability**: Ready for authentication and multi-user support

## Caching Strategy

All user data queries are cached:
- **User profiles**: 10 minutes
- **Saved items**: 5 minutes
- **Saved locations**: 5 minutes

Cache invalidates automatically when data changes.

## Future Enhancements

- **Authentication**: Ready for Supabase Auth integration
- **Row Level Security**: Can enable RLS when auth is added
- **Real-time Sync**: Can add Supabase real-time subscriptions
- **Offline Queue**: Queue changes when offline, sync when online

## Testing

To test the integration:

1. **Create a trip**: Should save to `trips` table
2. **Save an itinerary**: Should save to `user_saved_items`
3. **Update profile**: Should update `user_profiles`
4. **Save a location**: Should save to `user_saved_locations`

Check Supabase dashboard to verify data is being stored correctly.
