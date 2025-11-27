-- =====================================================
-- Fix Role Update Issue During Signup
-- =====================================================
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled on profiles table
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profile by username" ON public.profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- 3. Create comprehensive policies
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Service role can insert profiles (for auth callback)
CREATE POLICY "Service can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own profile (including role during signup)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- 4. Grant necessary permissions
-- =====================================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 5. Verify policies were created correctly
-- =====================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- Expected Output:
-- You should see 4 policies:
-- - Service can insert profiles (INSERT)
-- - Users can delete own profile (DELETE)
-- - Users can update own profile (UPDATE)
-- - Users can view own profile (SELECT)
-- =====================================================

-- 6. Test the setup (optional)
-- =====================================================
-- After running this, test by:
-- 1. Signing up as a new owner
-- 2. Check browser console for "✅ Profile role updated successfully"
-- 3. Verify role in profiles table

