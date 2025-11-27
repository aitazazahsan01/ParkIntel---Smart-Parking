-- =====================================================
-- ParkIntel - Add owner_id to ParkingLots Table
-- =====================================================
-- Run this in your Supabase SQL Editor

-- 1. Add owner_id column to ParkingLots table
-- =====================================================
ALTER TABLE public."ParkingLots" 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Create index for faster owner lookups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_parkinglots_owner_id 
ON public."ParkingLots"(owner_id);

-- 3. Add comment to column for documentation
-- =====================================================
COMMENT ON COLUMN public."ParkingLots".owner_id IS 'UUID of the lot owner from profiles table';

-- 4. Update RLS policies for ParkingLots
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Owners can view their own lots" ON public."ParkingLots";
DROP POLICY IF EXISTS "Owners can insert their own lots" ON public."ParkingLots";
DROP POLICY IF EXISTS "Owners can update their own lots" ON public."ParkingLots";
DROP POLICY IF EXISTS "Owners can delete their own lots" ON public."ParkingLots";
DROP POLICY IF EXISTS "Public can view parking lots" ON public."ParkingLots";

-- Enable RLS on ParkingLots if not already enabled
ALTER TABLE public."ParkingLots" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view all parking lots (for map)
CREATE POLICY "Public can view parking lots"
  ON public."ParkingLots"
  FOR SELECT
  USING (true);

-- Policy: Owners can view their own lots
CREATE POLICY "Owners can view their own lots"
  ON public."ParkingLots"
  FOR SELECT
  USING (owner_id = auth.uid());

-- Policy: Owners can insert their own lots
CREATE POLICY "Owners can insert their own lots"
  ON public."ParkingLots"
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Policy: Owners can update their own lots
CREATE POLICY "Owners can update their own lots"
  ON public."ParkingLots"
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: Owners can delete their own lots
CREATE POLICY "Owners can delete their own lots"
  ON public."ParkingLots"
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if column was added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'ParkingLots' AND column_name = 'owner_id';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
