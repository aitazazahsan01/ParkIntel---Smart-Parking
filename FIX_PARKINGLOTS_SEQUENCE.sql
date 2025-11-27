-- Fix ParkingLots table primary key issue
-- Run this in Supabase SQL Editor

-- 1. Check current sequence value
SELECT setval('parkinglots_id_seq', (SELECT MAX(id) FROM "ParkingLots"), true);

-- If the above doesn't work, try this alternative:

-- 2. Reset the sequence to start from the max ID + 1
DO $$
BEGIN
    PERFORM setval(
        pg_get_serial_sequence('"ParkingLots"', 'id'),
        (SELECT COALESCE(MAX(id), 0) + 1 FROM "ParkingLots"),
        false
    );
END $$;

-- 3. Verify the current sequence value
SELECT currval(pg_get_serial_sequence('"ParkingLots"', 'id'));

-- 4. Check for any duplicate IDs (should return 0)
SELECT id, COUNT(*) 
FROM "ParkingLots" 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 5. If you want to see all parking lots
SELECT id, name, owner_id, created_at 
FROM "ParkingLots" 
ORDER BY id DESC 
LIMIT 10;
