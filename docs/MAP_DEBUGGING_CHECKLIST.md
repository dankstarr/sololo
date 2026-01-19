# Map Debugging Checklist

## Where to Check for Map Issues

### 1. Browser Console (Most Important)
**How to open:**
- Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Firefox: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
- Safari: Enable Developer Menu first, then `Cmd+Option+C`

**What to look for:**
- ✅ **Success messages:**
  - `GoogleMap: ✅ Google Maps API loaded, initializing map...`
  - `GoogleMapFallback: ✅ Google Maps API loaded, initializing map...`
  - `GoogleMap: ✅ Map created successfully`
  - `GoogleMapFallback: ✅ Map created successfully`

- ❌ **Error messages:**
  - `Failed to load Google Maps API`
  - `Module places has been provided more than once` (should be fixed now)
  - `Map ID is required for Advanced Markers`
  - `Google Maps API key not configured`
  - Any red error messages

### 2. Network Tab
**How to open:**
- In DevTools, click the **Network** tab
- Refresh the page (`Cmd+R` or `Ctrl+R`)

**What to check:**
1. **Filter by "maps.googleapis.com"**
   - Look for requests to `maps.googleapis.com/maps/api/js`
   - Status should be `200` (green) ✅
   - If `403` (red) ❌: API key is invalid or restricted
   - If `404` (red) ❌: Network issue or wrong URL

2. **Check the request URL:**
   - Should include: `?key=YOUR_API_KEY&libraries=places,marker&loading=async`
   - Verify your API key is in the URL (it's safe to see in Network tab)

3. **Response:**
   - Should load JavaScript code (not HTML error page)

### 3. Map Display
**Where to check:**
- **Main map page:** `http://localhost:3001/app/map`
- **Top locations page:** `http://localhost:3001/discover/locations` (if map toggle is enabled)

**What you should see:**
- ✅ Map tiles rendering (street map, satellite, etc.)
- ✅ Markers/pins on the map
- ✅ Map is interactive (can drag, zoom)

**What you might see instead:**
- ❌ Gray/blank area
- ❌ "Loading map..." spinner that never stops
- ❌ Error message overlay
- ❌ Only markers but no map background

### 4. Environment Variables
**File location:** `.env.local` (in project root)

**How to check:**
```bash
# In terminal, run:
cat .env.local
```

**What should be there:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=779bcbbf99c62f02f0d7beab
# Optional - use fallback if Map ID doesn't work:
# NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
```

**Important:**
- File must be named `.env.local` (with the dot at the start)
- Must restart dev server after changing `.env.local`
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser

### 5. Dev Server Console
**Where:** Terminal where you ran `npm run dev`

**What to look for:**
- ✅ No errors during compilation
- ✅ Server running on `http://localhost:3001`
- ❌ Build errors
- ❌ Import errors

### 6. Map Container Element
**How to check:**
- Open DevTools → **Elements** tab
- Search for `div` with `id="map"` or class containing "map"

**What to verify:**
- Element exists ✅
- Has width and height (not `0px`) ✅
- Not hidden (`display: none` or `visibility: hidden`) ✅
- Has proper z-index ✅

### Quick Debugging Steps

1. **Check Console first** - Most issues show up here
2. **Check Network tab** - Verify API is loading
3. **Check .env.local** - Verify API key and Map ID are set
4. **Restart dev server** - After changing .env.local
5. **Hard refresh browser** - `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

### Common Issues & Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| "API key not configured" | .env.local | Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| "Map ID required" | .env.local | Add `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` |
| "Module provided more than once" | Console | Should be fixed with shared loader |
| Map is blank/gray | Network tab | Check API key status (403 = invalid) |
| Only markers, no map | Console | Map ID might be invalid, try fallback mode |
| Map doesn't load | Network tab | Check if request to maps.googleapis.com succeeds |

### Enable Fallback Mode (If Map ID Issues)

If Advanced Markers don't work, enable fallback mode:

1. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
   ```

2. Restart dev server

3. This uses legacy markers (no Map ID required)

### Still Not Working?

1. **Share console errors** - Copy/paste any red errors
2. **Share network tab screenshot** - Show the maps.googleapis.com request
3. **Check API key in Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Verify API key exists and Maps JavaScript API is enabled
   - Check API key restrictions (should allow your domain/localhost)
