-- Ensure drivers can access pre_bookings table for accurate availability calculation
-- This script verifies and updates RLS policies to allow all authenticated users (including drivers)
-- to view pre_bookings data, which is needed for the formula:
-- Available Spots = Total Spots - Occupied Spots - Reserved Spots

-- Verify RLS is enabled
ALTER TABLE public.pre_bookings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the SELECT policy to ensure drivers have access
DROP POLICY IF EXISTS "Authenticated users can view all pre_bookings" ON public.pre_bookings;

-- Policy: All authenticated users can view all pre_bookings
-- This is necessary for drivers to see reservation counts and calculate availability
CREATE POLICY "Authenticated users can view all pre_bookings"
ON public.pre_bookings
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy is correctly set
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'pre_bookings' 
AND cmd = 'SELECT';

-- Test query to verify drivers can access pre_bookings
-- Run this as a driver user to verify access:
-- SELECT COUNT(*) FROM public.pre_bookings WHERE status = 'active';

-- Additional verification: Check grants
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'pre_bookings' 
AND grantee IN ('authenticated', 'anon');

-- If needed, grant SELECT permission explicitly
GRANT SELECT ON public.pre_bookings TO authenticated;

COMMIT;
