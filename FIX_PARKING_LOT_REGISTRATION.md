# Fix: Parking Lot Registration - Duplicate Key Error

## Problem
Error when registering a parking lot:
```
duplicate key value violates unique constraint "ParkingLots_pkey"
```

## Root Cause
The PostgreSQL sequence for auto-generating IDs is out of sync with the actual data in the table. This happens when:
1. Data was manually inserted with specific IDs
2. The sequence wasn't updated after bulk inserts
3. The sequence was reset incorrectly

## Solution

### Step 1: Reset the Database Sequence

Run this in **Supabase SQL Editor**:

```sql
-- Reset the sequence to the correct value
SELECT setval(
    pg_get_serial_sequence('"ParkingLots"', 'id'),
    (SELECT COALESCE(MAX(id), 0) + 1 FROM "ParkingLots"),
    false
);
```

**What this does:** Sets the next ID to be one more than the current maximum ID in the table.

### Step 2: Verify the Fix

```sql
-- Check current sequence value
SELECT currval(pg_get_serial_sequence('"ParkingLots"', 'id'));

-- Should show a number greater than the max ID in your table
```

### Step 3: Check for Duplicates (Optional)

```sql
-- This should return 0 rows (no duplicates)
SELECT id, COUNT(*) 
FROM "ParkingLots" 
GROUP BY id 
HAVING COUNT(*) > 1;
```

### Step 4: Test Creating a New Lot

1. Go to `/owner/register-lot`
2. Enter a lot name (e.g., "Test Lot 123")
3. Add some parking spots
4. Click "Publish Layout"
5. Should work without errors now!

## Code Changes Made

### 1. Better Error Handling
- Now shows specific error messages for duplicate names
- Better handling of missing data
- Clear success message with lot name and spot count

### 2. Form Reset After Success
- Clears lot name and address
- Removes all parking spots
- Resets counters
- Auto-redirects to owner dashboard after 1.5 seconds

### 3. Improved Insert Logic
- Single object insert instead of array (more reliable)
- Better null handling for address field
- Early return on errors (prevents cascade failures)

## Alternative Solutions

### If the above doesn't work, try:

#### Option A: Drop and Recreate Sequence
```sql
-- Only use if Step 1 didn't work
ALTER TABLE "ParkingLots" ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS parkinglots_id_seq CASCADE;
CREATE SEQUENCE parkinglots_id_seq START WITH 1;
ALTER TABLE "ParkingLots" ALTER COLUMN id SET DEFAULT nextval('parkinglots_id_seq');
SELECT setval('parkinglots_id_seq', (SELECT MAX(id) FROM "ParkingLots"));
```

#### Option B: Clear Test Data
```sql
-- Remove all test parking lots (CAREFUL!)
DELETE FROM parking_spots WHERE lot_id IN (
    SELECT id FROM "ParkingLots" WHERE name LIKE '%Test%'
);
DELETE FROM "ParkingLots" WHERE name LIKE '%Test%';

-- Reset sequence
SELECT setval(
    pg_get_serial_sequence('"ParkingLots"', 'id'),
    (SELECT COALESCE(MAX(id), 0) + 1 FROM "ParkingLots"),
    false
);
```

## Testing

### Test Case 1: Create New Lot
```
1. Name: "Downtown Parking A"
2. Address: "123 Main Street"
3. Add 5 parking spots
4. Click "Publish Layout"
Expected: ✅ Success message, redirect to dashboard
```

### Test Case 2: Duplicate Name
```
1. Use same name as existing lot
2. Try to publish
Expected: Error message about duplicate name
```

### Test Case 3: Form Reset
```
1. Create a lot successfully
2. Check that form is cleared
3. All spots removed
4. Can create another lot immediately
```

## Verification Queries

Check your parking lots:
```sql
-- See all lots with owner info
SELECT 
    pl.id,
    pl.name,
    pl.address,
    pl.capacity,
    p.email as owner_email,
    COUNT(ps.id) as spots_count
FROM "ParkingLots" pl
LEFT JOIN profiles p ON pl.owner_id = p.id
LEFT JOIN parking_spots ps ON ps.lot_id = pl.id
GROUP BY pl.id, pl.name, pl.address, pl.capacity, p.email
ORDER BY pl.id DESC;
```

## Prevention

To prevent this in the future:

1. **Always use Supabase insert methods** (don't manually set IDs)
2. **After bulk imports**, run the sequence reset query
3. **Don't use `.insert([])` with array** - use `.insert({})` with single object for single inserts

## Summary

✅ **Fixed:** Duplicate key error in ParkingLots table  
✅ **Added:** Better error handling and messages  
✅ **Added:** Form reset after successful save  
✅ **Added:** Auto-redirect to dashboard  
✅ **Created:** SQL script to fix sequence issues  

Run the SQL from Step 1, and you should be good to go! 🚀
