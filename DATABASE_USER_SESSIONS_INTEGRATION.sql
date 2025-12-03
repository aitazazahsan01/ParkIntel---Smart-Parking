-- ================================================================
-- DRIVER DASHBOARD INTEGRATION: Database Schema Updates
-- ================================================================
-- This script adds user_id tracking to parking_sessions and ensures
-- proper linking between pre-bookings, sessions, and driver profiles
-- ================================================================

-- STEP 1: Add user_id column to parking_sessions table
-- This links sessions to the driver who created the pre-booking
ALTER TABLE public.parking_sessions
ADD COLUMN IF NOT EXISTS user_id uuid NULL;

-- Add foreign key constraint (using DO block for IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parking_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE public.parking_sessions
        ADD CONSTRAINT parking_sessions_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_parking_sessions_user_id 
ON public.parking_sessions (user_id);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_parking_sessions_status 
ON public.parking_sessions (status);

-- Create composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_parking_sessions_user_status 
ON public.parking_sessions (user_id, status) 
WHERE user_id IS NOT NULL;

-- ================================================================
-- STEP 2: Update RLS Policies for parking_sessions
-- ================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own parking sessions" ON public.parking_sessions;
DROP POLICY IF EXISTS "Operators can view sessions for assigned lots" ON public.parking_sessions;
DROP POLICY IF EXISTS "Operators can insert sessions" ON public.parking_sessions;
DROP POLICY IF EXISTS "Operators can update sessions" ON public.parking_sessions;
DROP POLICY IF EXISTS "Authenticated users can view all sessions" ON public.parking_sessions;

-- Enable RLS
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Drivers can view their own sessions
CREATE POLICY "Drivers can view own parking sessions"
ON public.parking_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 2: Operators can view all sessions for their assigned lots
CREATE POLICY "Operators can view sessions for assigned lots"
ON public.parking_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.operators
    WHERE operators.owner_id = auth.uid()
    AND parking_sessions.lot_id = ANY(operators.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'operator'
    AND parking_sessions.lot_id = ANY(profiles.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public."ParkingLots"
    WHERE "ParkingLots".id = parking_sessions.lot_id
    AND "ParkingLots".owner_id = auth.uid()
  )
);

-- Policy 3: Operators can insert sessions (when checking in vehicles)
CREATE POLICY "Operators can insert sessions"
ON public.parking_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operators
    WHERE operators.owner_id = auth.uid()
    AND lot_id = ANY(operators.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'operator'
    AND lot_id = ANY(profiles.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public."ParkingLots"
    WHERE "ParkingLots".id = lot_id
    AND "ParkingLots".owner_id = auth.uid()
  )
);

-- Policy 4: Operators can update sessions (when checking out)
CREATE POLICY "Operators can update sessions"
ON public.parking_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.operators
    WHERE operators.owner_id = auth.uid()
    AND parking_sessions.lot_id = ANY(operators.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'operator'
    AND parking_sessions.lot_id = ANY(profiles.assigned_lots)
  )
  OR
  EXISTS (
    SELECT 1 FROM public."ParkingLots"
    WHERE "ParkingLots".id = parking_sessions.lot_id
    AND "ParkingLots".owner_id = auth.uid()
  )
);

-- ================================================================
-- STEP 3: Create function to auto-link sessions to users
-- ================================================================

-- Function to automatically set user_id when checking in a vehicle
-- This function finds the user_id from pre_bookings table based on plate number
CREATE OR REPLACE FUNCTION public.link_session_to_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only process on INSERT (when session is created)
  IF TG_OP = 'INSERT' THEN
    -- Try to find user_id from active or converted pre_bookings
    SELECT user_id INTO v_user_id
    FROM public.pre_bookings
    WHERE lot_id = NEW.lot_id
      AND plate_number = NEW.plate_number
      AND status IN ('active', 'converted')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If found, set the user_id
    IF v_user_id IS NOT NULL THEN
      NEW.user_id := v_user_id;
      RAISE NOTICE 'Linked session to user_id: %', v_user_id;
    ELSE
      RAISE NOTICE 'No matching pre-booking found for plate: %, lot: %', NEW.plate_number, NEW.lot_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on parking_sessions table
DROP TRIGGER IF EXISTS link_session_to_user_trigger ON public.parking_sessions;

CREATE TRIGGER link_session_to_user_trigger
BEFORE INSERT ON public.parking_sessions
FOR EACH ROW
EXECUTE FUNCTION public.link_session_to_user();

-- ================================================================
-- STEP 4: Backfill existing sessions with user_id (optional)
-- ================================================================

-- This updates existing parking_sessions to link them to users
-- Only updates sessions that have matching pre_bookings
UPDATE public.parking_sessions ps
SET user_id = pb.user_id
FROM public.pre_bookings pb
WHERE ps.lot_id = pb.lot_id
  AND ps.plate_number = pb.plate_number
  AND ps.user_id IS NULL
  AND pb.status IN ('active', 'converted')
  AND ps.created_at >= pb.created_at - INTERVAL '2 hours'
  AND ps.created_at <= pb.expires_at + INTERVAL '1 hour';

-- ================================================================
-- STEP 5: Grant necessary permissions
-- ================================================================

GRANT SELECT, INSERT, UPDATE ON public.parking_sessions TO authenticated;
GRANT USAGE ON SEQUENCE parking_sessions_id_seq TO authenticated;

-- ================================================================
-- STEP 6: Verification Queries
-- ================================================================

-- Verify the schema changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'parking_sessions'
AND column_name = 'user_id';

-- Verify RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE tablename = 'parking_sessions'
ORDER BY policyname;

-- Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'parking_sessions'
ORDER BY trigger_name;

-- Test query: Count sessions by user
SELECT 
    p.full_name,
    p.role,
    COUNT(ps.id) as session_count,
    SUM(CASE WHEN ps.status = 'active' THEN 1 ELSE 0 END) as active_sessions,
    SUM(CASE WHEN ps.status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
    SUM(COALESCE(ps.fee_charged, 0)) as total_spent
FROM public.parking_sessions ps
JOIN public.profiles p ON p.id = ps.user_id
WHERE ps.user_id IS NOT NULL
GROUP BY p.id, p.full_name, p.role
ORDER BY session_count DESC
LIMIT 10;

-- ================================================================
-- Summary of Changes:
-- ================================================================
-- ✅ Added user_id column to parking_sessions
-- ✅ Created indexes for performance
-- ✅ Set up RLS policies for drivers and operators
-- ✅ Created auto-linking trigger function
-- ✅ Backfilled existing data
-- ✅ Granted necessary permissions
--
-- Now when an operator checks in a vehicle:
-- 1. The trigger automatically finds the user from pre_bookings
-- 2. Links the session to the driver's user_id
-- 3. Driver can see their session in the dashboard
-- 4. Stats update automatically (active, completed, total spent)
-- ================================================================

COMMIT;
