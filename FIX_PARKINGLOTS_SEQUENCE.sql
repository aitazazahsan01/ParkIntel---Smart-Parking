-- Fix ParkingLots table primary key issue
-- Run this in Supabase SQL Editor

-- 1. Find the correct sequence name first
SELECT 
    pg_get_serial_sequence('"ParkingLots"', 'id') as sequence_name;

-- 2. Reset the sequence to start from the max ID + 1
-- Run this after confirming the sequence name from step 1
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Get the sequence name dynamically
    seq_name := pg_get_serial_sequence('"ParkingLots"', 'id');
    
    -- Reset the sequence
    EXECUTE format('SELECT setval(%L, (SELECT COALESCE(MAX(id), 0) + 1 FROM "ParkingLots"), false)', seq_name);
END $$;

-- 3. Verify the fix - Check the sequence status
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE sequencename LIKE '%ParkingLots%';

-- 4. Check for any duplicate IDs (should return empty)
SELECT id, COUNT(*) as count
FROM "ParkingLots" 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 5. View all parking lots (without created_at)
SELECT id, name, owner_id, total_spots, price_per_hour
FROM "ParkingLots" 
ORDER BY id DESC 
LIMIT 10;
