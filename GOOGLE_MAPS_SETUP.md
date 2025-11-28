# Google Maps Setup Guide

## ✅ Changes Completed

### 1. **Authentication Required for Map Access**
- ❌ Removed `/map` from public routes
- ✅ Users must sign in or sign up to access the map
- ✅ Landing page updated - "Sign In to View Map" button instead of direct map access

### 2. **Switched from Mapbox to Google Maps**
- ✅ Removed Mapbox dependencies (`mapbox-gl`, `react-map-gl`, `@mapbox/mapbox-gl-geocoder`)
- ✅ Added Google Maps React wrapper (`@googlemaps/react-wrapper`)
- ✅ Created custom `GoogleMap` component with TypeScript support
- ✅ Updated map page with full Google Maps integration

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

Run this command in the ParkIntel directory:

```bash
npm install
```

This will install:
- `@googlemaps/react-wrapper` - Google Maps React integration
- `@types/google.maps` - TypeScript definitions for Google Maps

---

### Step 2: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API** (for search functionality)
   - **Geocoding API** (optional, for address lookup)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

**Important Security Steps:**
- Click on your API key to edit it
- Under "API restrictions", select "Restrict key"
- Enable only: Maps JavaScript API, Places API
- Under "Application restrictions", select "HTTP referrers"
- Add: `http://localhost:3000/*` and `https://yourdomain.com/*`

---

### Step 3: Add API Key to Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

---

### Step 4: Test the Map

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. **Sign in or create an account** (map is now protected!)

4. Navigate to **Find Parking** or visit `/map`

5. You should see:
   - Interactive Google Map
   - Markers for all parking lots from database
   - Click markers to view lot details
   - Info panel with capacity, pricing, and directions

---

## 🎯 New Features

### Map Page (`/map`)
- **Authentication Required** - Only logged-in users can access
- **Real-time Parking Lots** - Fetches from Supabase `ParkingLots` table
- **Interactive Markers** - Click to see lot details
- **User Location** - Requests browser location (with permission)
- **Info Panel** - Shows selected lot information
- **Get Directions** - Button for navigation (can be customized)

### Google Maps Component (`components/google-map.tsx`)
- Fully reusable component
- TypeScript support
- Props for center, zoom, markers, and click handlers
- Loading and error states
- Custom marker styling
- Info windows for marker details

---

## 📊 Database Requirements

Make sure your `ParkingLots` table has these columns:
```sql
- id (bigint)
- name (text)
- address (text)
- lat (double precision) - Latitude coordinate
- lng (double precision) - Longitude coordinate
- capacity (integer)
- base_price (double precision)
```

**Important:** When owners register a parking lot, they need to provide `lat` and `lng` coordinates. You may want to add geocoding to the register-lot page to convert addresses to coordinates automatically.

---

## 🔧 Customization Options

### Change Default Location
Edit `components/google-map.tsx`:
```typescript
center = { lat: 31.5204, lng: 74.3587 }, // Change to your city
```

### Change Map Style
Edit the `styles` array in `google-map.tsx`:
```typescript
styles: [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  // Add more style rules
],
```

### Add Search Functionality
The Places API is already included. You can add an autocomplete search box by using the `google.maps.places.Autocomplete` class.

---

## 🐛 Troubleshooting

### "Map Error: Google Maps API key not found"
- Make sure `.env.local` exists with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restart the dev server after adding the key

### "Failed to load Google Maps"
- Check if your API key is valid
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for specific error messages

### Markers Not Showing
- Verify `lat` and `lng` values in database are not 0 or NULL
- Check that coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### "This page can't load Google Maps correctly"
- Your API key might have restrictions
- Add your domain to "HTTP referrers" in Google Cloud Console

---

## 💰 Google Maps Pricing

Google Maps offers **$200 free credit per month**, which covers:
- ~28,000 map loads per month
- Plus additional API calls

For most small to medium applications, this is **completely free**.

**Current Pricing (as of 2024):**
- Maps JavaScript API: $7 per 1,000 loads
- Places API: $17 per 1,000 requests

Monitor usage at: [Google Cloud Console → Billing](https://console.cloud.google.com/billing)

---

## ✅ Testing Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Google Maps API key added to `.env.local`
- [ ] Dev server restarted
- [ ] Can't access `/map` without login
- [ ] Landing page requires sign in for map
- [ ] Map loads after login
- [ ] Markers appear for parking lots
- [ ] Clicking markers shows info panel
- [ ] Browser location permission works
- [ ] No console errors

---

## 📝 Next Steps (Optional Enhancements)

1. **Add Geocoding to Register Lot**
   - Convert address to lat/lng automatically when owners register lots

2. **Add Search Bar**
   - Use Google Places Autocomplete for location search

3. **Add Route Planning**
   - Integrate Directions API for navigation

4. **Add Clustering**
   - Group nearby markers when zoomed out

5. **Real-time Availability**
   - Show available spots count on markers
   - Update in real-time using Supabase subscriptions

---

**All done! Your map is now powered by Google Maps and requires authentication.** 🎉
