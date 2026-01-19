# How to Verify Your Google Maps Map ID

## 1. Check Browser Console (Easiest Method)

1. Open your app in the browser (`http://localhost:3001/app/map`)
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Look for these log messages:

### ✅ If Map ID is loaded correctly:
```
GoogleMap: Configuration check { hasApiKey: true, mapId: "8a3241f8f2d5caf4194a824c", mapIdLength: 24 }
GoogleMap: ✅ Using Map ID from config: 8a3241f8f2d5caf4194a824c
GoogleMap: Creating map with options: { mapId: "8a3241f8f2d5caf4194a824c", ... }
GoogleMap: ✅ Tiles loaded successfully
GoogleMap: Found X tile images in DOM
```

### ⚠️ If Map ID is NOT loaded:
```
GoogleMap: Configuration check { hasApiKey: true, mapId: "", mapIdLength: 0 }
GoogleMap: ⚠️ No Map ID in config, using fallback: 8a3241f8f2d5caf4194a824c
```

## 2. Check .env.local File

1. Open `.env.local` in your project root
2. Verify this line exists:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=8a3241f8f2d5caf4194a824c
   ```
3. Make sure:
   - No spaces around the `=`
   - No quotes around the Map ID
   - The Map ID is exactly: `8a3241f8f2d5caf4194a824c`

## 3. Verify in Google Cloud Console

1. Go to [Google Cloud Console - Maps Platform Studio](https://console.cloud.google.com/google/maps-apis/studio/maps)
2. Sign in with your Google account
3. Select your project
4. You should see your Map ID listed: `8a3241f8f2d5caf4194a824c`
5. Click on it to verify:
   - It's associated with your project
   - Maps JavaScript API is enabled
   - The Map ID is active

## 4. Check API Key Permissions

1. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/dashboard)
2. Make sure **Maps JavaScript API** is enabled
3. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
4. Click on your API key
5. Under "API restrictions", ensure:
   - Maps JavaScript API is allowed
   - Or "Don't restrict key" is selected (for development)

## 5. Verify Map ID Format

Your Map ID should be:
- **Format**: 24 hexadecimal characters (no spaces, no dashes)
- **Your Map ID**: `8a3241f8f2d5caf4194a824c`
- **Length**: Exactly 24 characters

## 6. Test After Restart

After adding/changing the Map ID in `.env.local`:

1. **Stop your dev server** (Ctrl+C)
2. **Restart it**: `npm run dev`
3. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. **Check console** again for the Map ID logs

## Common Issues

### Map ID not loading:
- ✅ Check `.env.local` file exists
- ✅ Check variable name is exactly `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- ✅ Check no typos in the Map ID
- ✅ Restart dev server after changes

### Map ID invalid:
- ✅ Verify Map ID in Google Cloud Console
- ✅ Ensure Map ID belongs to your project
- ✅ Check API key has access to Maps JavaScript API

### Tiles not showing:
- ✅ Check console for "Tiles loaded successfully" message
- ✅ Check console for "Found X tile images" (should be > 0)
- ✅ Verify Map ID is being used (check logs)
- ✅ Check browser network tab for failed tile requests

## Quick Debug Command

Run this in your browser console on the map page:
```javascript
// Check if Map ID is loaded
console.log('Map ID from env:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID);

// Check map instance
const mapDiv = document.querySelector('[ref]');
if (mapDiv && window.google) {
  console.log('Google Maps loaded:', !!window.google.maps);
}
```
