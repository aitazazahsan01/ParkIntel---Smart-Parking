# 🔧 Database Sequence Fix Guide

## Problem
You're seeing this error when trying to create a parking lot:
```
duplicate key value violates unique constraint "ParkingLots_pkey"
```

This happens when PostgreSQL's auto-increment sequence gets out of sync with the actual data.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fix Script
Copy and paste the following SQL into the editor and click **RUN**:

```sql
-- Fix ParkingLots table primary key sequence
-- This resets the auto-increment counter to the correct value

DO $$
BEGIN
    -- Reset the sequence to start from the max ID + 1
    PERFORM setval(
        pg_get_serial_sequence('"ParkingLots"', 'id'),
        (SELECT COALESCE(MAX(id), 0) + 1 FROM "ParkingLots"),
        false
    );
END $$;

-- Verify the fix
SELECT 
    'Current sequence value: ' || currval(pg_get_serial_sequence('"ParkingLots"', 'id')) as status;

-- Check for duplicate IDs (should return empty)
SELECT id, COUNT(*) as count
FROM "ParkingLots" 
GROUP BY id 
HAVING COUNT(*) > 1;
```

### Step 3: Verify
You should see:
- ✅ "Current sequence value: [number]"
- ✅ Empty result for duplicate check (no duplicates)

### Step 4: Try Again
Go back to your parking lot registration page and try creating your lot again. It should work now!

## Why This Happens
This issue occurs when:
- Database was restored from a backup
- Manual ID insertion was performed
- Sequence was manually reset
- Database migrations were run out of order

## Prevention
- Always use the app's interface to create parking lots
- Avoid manually inserting records with specific IDs
- Let PostgreSQL auto-generate IDs

## Still Having Issues?
If the problem persists:
1. Check console for additional error details
2. Verify you're logged in as an owner
3. Check your RLS policies are correctly set up
4. Contact support with the full error message

---
*Last Updated: November 2025*
