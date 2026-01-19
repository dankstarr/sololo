# Google Maps Troubleshooting Guide

## Map Container is Draggable but No Tiles Showing

If your map container is interactive (you can drag it) but shows a blank/gray background, here are the most common causes:

### 1. Map ID Not Associated with API Key ⚠️ **MOST COMMON**

**Symptoms:**
- Map container exists and is draggable
- No tiles/images visible (blank or gray background)
- Console shows: "Could not detect tile images"
- Map ID is configured in `.env.local`

**Cause:**
The Map ID exists but isn't associated with your API key in Google Cloud Console, or they're in different projects.

**Solution:**
- **Quick Fix:** Enable fallback mode (no Map ID needed):
  ```env
  NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
  ```
- **Proper Fix:** 
  1. Go to [Google Cloud Console - Maps Studio](https://console.cloud.google.com/google/maps-apis/studio/maps)
  2. Verify Map ID exists and is in the **same project** as your API key
  3. If Map ID doesn't exist, create a new map style and copy its Map ID
  4. Update `.env.local` with the correct Map ID
  5. Restart dev server

---

### 2. API Key Issues

**Symptoms:**
- Map doesn't initialize at all
- Console shows: "Google Maps API key not configured"
- Error messages about API key

**Common Causes:**
- API key not set in `.env.local`
- API key has wrong name: should be `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- API key doesn't have Maps JavaScript API enabled
- API key has domain restrictions blocking localhost
- Billing not enabled on Google Cloud project

**Solution:**
1. Check `.env.local` has: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here`
2. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/dashboard)
3. Ensure **Maps JavaScript API** is enabled
4. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
5. Click your API key → Check:
   - API restrictions: Maps JavaScript API is allowed
   - Application restrictions: Allow `localhost:3001` (or remove restrictions for dev)
6. Ensure billing is enabled: [Billing](https://console.cloud.google.com/billing)

---

### 3. Map ID Format Issues

**Symptoms:**
- Console shows: "Invalid Map ID format"
- Map ID validation errors

**Common Causes:**
- Map ID has spaces or special characters
- Map ID is wrong length (should be 24 hex characters)
- Map ID has quotes in `.env.local`

**Solution:**
- Map ID should be exactly 24 hexadecimal characters
- No spaces, no quotes, no dashes
- Example: `8a3241f8f2d5caf4194a824c`
- In `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=8a3241f8f2d5caf4194a824c` (no quotes)

---

### 4. Environment Variable Not Loaded

**Symptoms:**
- Variables set in `.env.local` but not working
- Console shows empty values

**Common Causes:**
- Dev server not restarted after adding variables
- Wrong file name: should be `.env.local` (with dot at start)
- Variables not prefixed with `NEXT_PUBLIC_` for client-side access

**Solution:**
1. Verify file is named `.env.local` (not `env.local` or `.env`)
2. Ensure variables start with `NEXT_PUBLIC_` for client-side access
3. **Restart dev server** after any `.env.local` changes
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

---

### 5. Map Container CSS Issues

**Symptoms:**
- Map container has zero dimensions
- Map not visible at all

**Common Causes:**
- Container has `display: none` or `visibility: hidden`
- Container has `height: 0` or `width: 0`
- Parent container has no height
- CSS conflicts

**Solution:**
- Ensure map container has explicit dimensions:
  ```css
  width: 100%;
  height: 100%;
  min-height: 400px;
  ```
- Check parent containers also have height
- Use browser DevTools to inspect container dimensions

---

### 6. Google Maps API Loading Issues

**Symptoms:**
- Console shows: "window.google.maps.Map is not a constructor"
- Script loading errors
- Network errors for maps.googleapis.com

**Common Causes:**
- API not fully loaded when map initializes
- Network/CORS issues
- Script blocked by ad blocker
- Incorrect script URL

**Solution:**
- Check browser Network tab for failed requests to `maps.googleapis.com`
- Disable ad blockers temporarily
- Check browser console for CORS errors
- Verify script URL includes correct API key and libraries

---

### 7. Advanced Markers vs Legacy Markers

**Symptoms:**
- Map shows but markers don't appear
- Console warnings about Advanced Markers

**Common Causes:**
- Using Advanced Markers without Map ID
- Map ID not configured correctly
- Marker library not loaded

**Solution:**
- Use fallback mode (legacy markers): `NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true`
- Or ensure Map ID is correctly configured for Advanced Markers

---

## Quick Diagnostic Checklist

Run through this checklist to identify the issue:

- [ ] Is API key set in `.env.local`? (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- [ ] Did you restart dev server after adding env variables?
- [ ] Is Maps JavaScript API enabled in Google Cloud Console?
- [ ] Is billing enabled on your Google Cloud project?
- [ ] Does API key allow `localhost:3001` (or have no domain restrictions)?
- [ ] Is Map ID configured? (`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`)
- [ ] Is Map ID in same project as API key?
- [ ] Does map container have dimensions (width/height)?
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests to `maps.googleapis.com`

---

## Recommended Solution: Use Fallback Mode

If you're having persistent issues, the easiest solution is to use fallback mode:

1. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_USE_FALLBACK=true
   ```

2. Restart dev server

3. Map will work without Map ID using legacy markers

**Benefits:**
- ✅ No Map ID configuration needed
- ✅ Works immediately
- ✅ Uses stable, well-supported legacy markers
- ✅ Same functionality for most use cases

---

## Browser Console Debugging

Open browser DevTools (F12) and check:

1. **Console Tab:**
   - Look for Google Maps initialization messages
   - Check for error messages
   - Verify Map ID is loaded correctly

2. **Network Tab:**
   - Filter by `maps.googleapis.com`
   - Check for failed requests (red status codes)
   - Verify tile requests are being made
   - Check response for error messages

3. **Elements Tab:**
   - Inspect map container element
   - Check if it has dimensions
   - Look for canvas/img elements inside (tiles)

---

## Common Error Messages and Solutions

| Error Message | Solution |
|--------------|----------|
| "Google Maps API key not configured" | Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local` |
| "Invalid Map ID format" | Check Map ID is 24 hex characters, no spaces |
| "window.google.maps.Map is not a constructor" | API not fully loaded - wait longer or check script loading |
| "Could not detect tile images" | Map ID not associated with API key - use fallback mode |
| "REQUEST_DENIED" | API key restrictions or billing issue |
| "Map container not found" | Check map container ref and CSS dimensions |

---

## Still Not Working?

1. **Try fallback mode first** - it's the quickest solution
2. **Check Google Cloud Console** - verify API key and Map ID settings
3. **Check browser console** - look for specific error messages
4. **Check Network tab** - see if requests are failing
5. **Try incognito mode** - rule out browser extensions
6. **Check if other Google Maps sites work** - verify it's not a network issue

---

## Need More Help?

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Maps Troubleshooting Guide](https://developers.google.com/maps/documentation/javascript/troubleshooting)
- [Google Cloud Console - Maps Platform Studio](https://console.cloud.google.com/google/maps-apis/studio/maps)
