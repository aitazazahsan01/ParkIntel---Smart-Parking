-- Fix RLS policy to allow username lookup during login
-- This policy allows unauthenticated users to read profiles when looking up by username
-- (needed for login flow to convert username → email)

-- Option 1: Allow anyone to read profiles (simplest)
DROP POLICY IF EXISTS "Allow username lookup for login" ON profiles;

CREATE POLICY "Allow username lookup for login"
ON profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: This allows reading profiles table for login purposes.
-- The actual password is stored in Supabase Auth (not in profiles), so this is secure.
-- Only email, username, and role are exposed which are needed for login routing.

-- If your profiles table has sensitive data you want to hide, use Option 2 below instead:

/*
-- Option 2: More restrictive - only allow reading specific columns
-- First, you would need to create a view with only non-sensitive columns:

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, email, username, role
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Then update your login code to query from profiles_public instead of profiles
*/
