# Admin Panel Verification Report

## Overview
This document verifies all sections of the admin panel (`/admin`) and documents the fixes applied to ensure accurate data tracking and display.

## Sections Verified

### ✅ 1. GCP Usage Verification Section
**Status**: Working correctly

**What it shows:**
- Gemini API usage from Google Cloud Platform
- Google Maps API usage from Google Cloud Platform
- Project ID and last update time

**Why it might show zeros:**
- ✅ **Expected behavior** - Metrics only appear after APIs are actually used
- ✅ **5-15 minute delay** - GCP metrics have propagation delay
- ✅ **Cloud Monitoring API** - Must be enabled in GCP project

**Fixes applied:**
- Enhanced diagnostic information explaining why metrics might be zero
- Shows connection status and project ID
- Clear instructions on how to verify APIs are working

**Data source:** `/api/admin/gcp-usage` (fetches from GCP Monitoring API)

---

### ✅ 2. Gemini API Usage Section
**Status**: Fixed and verified

**What it tracks:**
- Requests Today (vs daily limit)
- Tokens Today (vs daily limit)
- Requests per Minute (vs per-minute limit)
- Overall status (Healthy/Moderate/Near Limit)

**Fixes applied:**
- ✅ `getUsageStats()` now reloads from localStorage each call
- ✅ Handles daily resets correctly
- ✅ Added diagnostic info when stats are zero
- ✅ Debug logging in development mode

**Data source:** `localStorage` key: `gemini_usage_stats`
**Tracking:** Increments when `callGeminiAPI()` is called (not cached responses)

**Limits:**
- Daily requests: 60 (conservative limit)
- Daily tokens: 15M
- Per-minute requests: 60

---

### ✅ 3. Google Maps API Usage Section
**Status**: Fixed and verified

**What it tracks:**
- Requests Today (vs daily limit)
- Requests per Minute (vs per-minute limit)
- Breakdown by type: Geocode, Places, Directions, Place Details
- Overall status

**Fixes applied:**
- ✅ `getMapsUsageStats()` now reloads from localStorage each call
- ✅ Handles daily resets correctly
- ✅ Added diagnostic info when stats are zero

**Data source:** `localStorage` key: `google_maps_usage_stats`
**Tracking:** Increments when Maps API functions are called:
- `geocodeAddress()` → geocodeRequests
- `searchPlaces()` → placesRequests
- `getDirections()` → directionsRequests
- `getPlaceDetails()` → placeDetailsRequests

**Limits:**
- Daily requests: 40,000 (approximate)
- Per-minute requests: 100 (approximate)

---

### ✅ 4. App API Usage (Internal) Section
**Status**: Fixed and verified

**What it tracks:**
- Requests Today (all `/api/*` calls)
- Requests per Minute
- Errors Today
- Top Endpoint (most called endpoint)

**Fixes applied:**
- ✅ `getInternalApiStats()` now reloads from localStorage each call
- ✅ Handles daily resets correctly
- ✅ Added diagnostic info explaining tracking limitations
- ✅ Shows list of tracked endpoints

**Data source:** `localStorage` key: `internal_api_usage_stats`
**Tracking:** Only tracks calls made with `trackedFetch()` wrapper

**Important Note:**
- ⚠️ Most API calls use regular `fetch()` and are NOT tracked
- Only these components use `trackedFetch()`:
  - `ItineraryOverview.tsx`
  - `CollaboratorsPanel.tsx`
  - `EditHistoryPanel.tsx`
  - `app/discover/page.tsx`
  - `app/discover/share/[id]/page.tsx`

**Recommendation:** Consider replacing all `fetch('/api/*')` calls with `trackedFetch('/api/*')` for complete tracking.

---

### ✅ 5. Usage Graphs Section
**Status**: Working correctly

**What it shows:**
- Line chart: Requests over time (24 hours)
- Bar chart: Usage distribution comparison

**Data source:** `localStorage` key: `gemini_usage_history_${today}`
**Updates:** When `incrementHourlyUsage()` is called (from Gemini, Maps, or Internal API tracking)

**Note:** Chart shows combined request volume from all tracked sources.

---

### ✅ 6. Limits Table Section
**Status**: Working correctly

**What it shows:**
- Detailed breakdown of all limits
- Used vs. Total vs. Remaining
- Percentage indicators with color coding

**Data sources:**
- Gemini limits from `appConfig.gemini.freeTierLimits`
- Maps limits: hardcoded approximations
- Real-time stats from respective tracking functions

---

### ✅ 7. Alerts Section
**Status**: Working correctly

**What it shows:**
- Warning when approaching 70% usage
- Critical alert when approaching 90% usage
- Actionable recommendations

**Triggers:**
- Gemini requests ≥ 70% or tokens ≥ 70%
- Maps requests ≥ 70%
- Shows remaining counts when ≥ 90%

---

### ✅ 8. Discover Cities Management Section
**Status**: Working correctly

**What it shows:**
- List of cities from database
- Location count per city
- Expandable location details
- Delete functionality for cities and locations

**Data source:** `/api/cities` endpoint
**Features:**
- Refresh button to reload cities
- Expand/collapse to view locations
- Delete city (removes all locations)
- Delete individual locations

---

### ✅ 9. Page Configuration Editor Section
**Status**: Working correctly

**What it allows:**
- Edit marketing page content (hero, features, pricing)
- Configure app page settings (home, locations, itinerary, map, groups)
- Configure discover page settings
- Toggle global feature flags
- Edit UI settings (colors, etc.)

**Data source:** `/api/admin/config` endpoint (in-memory storage)
**Note:** For production, consider storing in Supabase or database.

**Tabs:**
1. Marketing - Hero, features, pricing
2. App Home - Group promo, accessibility, day limits
3. App Locations - Replace button, drag-drop, AI rationale
4. App Itinerary - Pace warnings, budget estimates, notes
5. App Map - Filters, Google Maps integration, route optimization
6. App Groups - Auto-expire, public groups, icebreakers
7. Discover - Items per page, filters, sharing
8. Global - Feature flags, UI settings

---

### ✅ 10. API Configuration Section
**Status**: Working correctly

**What it shows:**
- Gemini API enabled status
- Model name
- API key configured status
- Temperature setting

**Data source:** `appConfig.gemini` from config files
**Display:** Read-only configuration display

---

## Common Issues and Solutions

### Issue: All stats showing zero
**Possible causes:**
1. No API calls made yet
2. Stats reset daily at midnight
3. localStorage cleared
4. Using cached responses (don't increment stats)

**Solutions:**
- Make actual API calls (create trip, search locations)
- Check browser console for tracking logs (dev mode)
- Verify localStorage is accessible
- Check diagnostic sections in admin panel

### Issue: GCP metrics showing zero
**Possible causes:**
1. No API calls made yet
2. 5-15 minute propagation delay
3. Cloud Monitoring API not enabled
4. GCP credentials not configured

**Solutions:**
- Wait 5-15 minutes after making API calls
- Enable Cloud Monitoring API in GCP project
- Configure GCP credentials (see setup docs)
- Compare with local stats (update immediately)

### Issue: Internal API stats showing zero
**Possible causes:**
1. Using regular `fetch()` instead of `trackedFetch()`
2. No tracked API calls made yet

**Solutions:**
- Use `trackedFetch()` wrapper for `/api/*` calls
- Check which components are using `trackedFetch()`
- See diagnostic section for tracked endpoints

## Data Refresh Intervals

- **Local stats (Gemini, Maps, Internal):** Every 5 seconds
- **GCP metrics:** Every 60 seconds
- **Cities list:** Manual refresh only

## Storage Locations

All client-side stats are stored in `localStorage`:
- `gemini_usage_stats` - Gemini API usage
- `google_maps_usage_stats` - Maps API usage
- `internal_api_usage_stats` - Internal API usage
- `gemini_usage_history_${date}` - Hourly history

## Reset Functionality

"Reset All Stats for Today" button:
- Resets Gemini stats
- Resets Maps stats
- Resets Internal API stats
- Does NOT reset GCP metrics (server-side)
- Does NOT reset hourly history

## Recommendations

1. **Complete Internal API Tracking:**
   - Replace all `fetch('/api/*')` with `trackedFetch('/api/*')`
   - Or create global fetch wrapper

2. **Persistent Configuration:**
   - Store page config in Supabase instead of in-memory
   - Add versioning/history for config changes

3. **Enhanced Diagnostics:**
   - Add "Test API" buttons to verify tracking
   - Show last API call timestamp
   - Display cache hit/miss rates

4. **Better Error Handling:**
   - Show specific error messages for GCP connection issues
   - Display API key validation status
   - Warn if localStorage is disabled

## Verification Checklist

- [x] GCP Usage section loads and displays correctly
- [x] Gemini API stats reload from localStorage
- [x] Google Maps API stats reload from localStorage
- [x] Internal API stats reload from localStorage
- [x] Usage graphs display correctly
- [x] Limits table shows accurate data
- [x] Alerts trigger at correct thresholds
- [x] Cities management loads and functions correctly
- [x] Page configuration editor saves/loads correctly
- [x] API configuration displays correctly
- [x] Reset button works for all stats
- [x] Diagnostic info appears when stats are zero
- [x] All sections update on refresh

## Last Updated
December 2024
