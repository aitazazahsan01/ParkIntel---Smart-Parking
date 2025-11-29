# Parking Lot Registration Bug Fixes

## Issues Fixed

### 1. Multiple Map Markers Issue ✅
**Problem:** Users could place multiple pins on the map when selecting parking lot location.

**Solution:** 
- Changed `mapMarker` from React state to `useRef` to avoid stale closure issues
- Properly remove old marker before creating new one: `mapMarkerRef.current.setMap(null)`
- Clean up marker when modal closes
- Only one marker is allowed at a time now

**Files Changed:**
- `app/owner/register-lot/page.tsx`

**Technical Details:**
- Using `useState` for markers caused stale closure problems in the click listener
- The ref pattern ensures we always have access to the current marker instance
- Cleanup happens both when creating new marker and when modal unmounts

---

### 2. Database Primary Key Error ✅
**Problem:** Error `duplicate key value violates unique constraint "ParkingLots_pkey"` when creating parking lots.

**Root Cause:** PostgreSQL auto-increment sequence out of sync with actual data.

**Solution:**
- Added detailed error detection for sequence issues
- Provide clear instructions to users when this error occurs
- Created comprehensive fix guide: `DATABASE_SEQUENCE_FIX.md`
- Updated error message to be user-friendly with step-by-step fix instructions

**Files Changed:**
- `app/owner/register-lot/page.tsx` - Enhanced error handling
- `DATABASE_SEQUENCE_FIX.md` - New comprehensive guide

**User Experience:**
When the error occurs, users now see:
```
⚠️ DATABASE ERROR: Parking Lot ID Sequence Out of Sync

TO FIX THIS:
1. Open Supabase SQL Editor
2. Run the file: FIX_PARKINGLOTS_SEQUENCE.sql
3. Try creating your parking lot again

This happens when the auto-increment ID counter gets reset.
```

---

## How to Fix Your Database

If you're experiencing the database error, follow these steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click "SQL Editor" in sidebar

2. **Run Fix Script**
   - Either use `FIX_PARKINGLOTS_SEQUENCE.sql` (already in project)
   - Or see `DATABASE_SEQUENCE_FIX.md` for the SQL commands

3. **Verify**
   - Script will show current sequence value
   - Check for duplicates (should be empty)

4. **Try Again**
   - Go back to parking lot registration
   - Create your lot - should work now!

---

## Testing

Test both fixes by:

### Test 1: Single Marker
1. Click "Select Location on Map"
2. Click on map multiple times in different locations
3. **Expected:** Only ONE marker should be visible (moves to new location)
4. **Previous Bug:** Multiple markers appeared

### Test 2: Database Insert
1. Fill in parking lot details
2. Add parking spots
3. Select location on map
4. Click "Confirm & Publish"
5. **If sequence error occurs:** Follow error message instructions
6. **Expected:** Parking lot successfully created

---

## Code Changes Summary

### `app/owner/register-lot/page.tsx`

**Changed:**
```typescript
// Before
const [mapMarker, setMapMarker] = useState<google.maps.Marker | null>(null);

// After  
const mapMarkerRef = useRef<google.maps.Marker | null>(null);
```

**Marker Creation:**
```typescript
// Now properly removes old marker before creating new one
if (mapMarkerRef.current) {
  mapMarkerRef.current.setMap(null);
  mapMarkerRef.current = null;
}
const newMarker = new google.maps.Marker({...});
mapMarkerRef.current = newMarker;
```

**Error Handling:**
```typescript
// Now detects sequence issues specifically
if (lotError.code === '23505') {
  if (lotError.message && lotError.message.includes('ParkingLots_pkey')) {
    // Show detailed fix instructions
  }
}
```

---

## Prevention

### Marker Issue Prevention
- ✅ Fixed by using ref instead of state
- ✅ Proper cleanup in useEffect return
- ✅ Remove old marker before creating new

### Database Issue Prevention
- Run sequence fix script when needed
- Avoid manual ID insertion in database
- Let PostgreSQL auto-generate IDs
- Don't restore backups without fixing sequences

---

## Additional Resources

- `FIX_PARKINGLOTS_SEQUENCE.sql` - Quick SQL fix script
- `DATABASE_SEQUENCE_FIX.md` - Detailed fix guide with explanations
- Console logs now show full error details for debugging

---

*Fixed: November 28, 2025*
