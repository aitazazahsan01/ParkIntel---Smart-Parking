-- Update ParkingLots table column names
-- Run this in Supabase SQL Editor

-- 1. Rename 'capacity' to 'total_spots' (more descriptive)
ALTER TABLE "ParkingLots" 
RENAME COLUMN capacity TO total_spots;

-- 2. Rename 'base_price' to 'price_per_hour' (more explicit)
ALTER TABLE "ParkingLots" 
RENAME COLUMN base_price TO price_per_hour;

-- 3. Add 'release_buffer_multiplier' column if it doesn't exist
ALTER TABLE "ParkingLots" 
ADD COLUMN IF NOT EXISTS release_buffer_multiplier DECIMAL(3,1) DEFAULT 1.8 CHECK (release_buffer_multiplier >= 1.0);

-- 4. Update existing rows to have default buffer if NULL
UPDATE "ParkingLots" 
SET release_buffer_multiplier = 1.8 
WHERE release_buffer_multiplier IS NULL;

-- 5. Add comments for documentation
COMMENT ON COLUMN "ParkingLots".total_spots IS 'Total number of parking spots in this lot';
COMMENT ON COLUMN "ParkingLots".price_per_hour IS 'Base price per hour for parking (in Pakistani Rupees)';
COMMENT ON COLUMN "ParkingLots".release_buffer_multiplier IS 'Multiplier for travel time. If travel time is 10 min and buffer is 1.8, spot releases after 18 min if driver fails to arrive';

-- 6. Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ParkingLots' 
AND column_name IN ('total_spots', 'price_per_hour', 'release_buffer_multiplier')
ORDER BY column_name;

-- 7. Check existing data
SELECT 
    id,
    name,
    total_spots,
    price_per_hour,
    release_buffer_multiplier,
    owner_id
FROM "ParkingLots"
ORDER BY id DESC
LIMIT 5;

-- =====================================================
-- EXPLANATION:
-- =====================================================
-- total_spots: Number of parking spaces in the lot
-- price_per_hour: Hourly rate charged for parking
-- release_buffer_multiplier: Time buffer for driver arrival
--   Example: 
--   - Travel time: 10 minutes
--   - Buffer: 1.8x
--   - Spot will auto-release after: 10 × 1.8 = 18 minutes
--   - Buffer: 2.0x
--   - Spot will auto-release after: 10 × 2.0 = 20 minutes
-- =====================================================
