-- Fix Row Level Security (RLS) Policies for Profile Updates
-- This allows users to update their own profile role during signup

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create SELECT policy (users can read their own profile)
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Create INSERT policy (users can create their own profile)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create UPDATE policy (users can update their own profile)
-- THIS IS THE KEY POLICY FOR ROLE UPDATES
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check if RLS is enabled (should be TRUE)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Test query to verify current user can update their profile
-- (Run this after logging in to test)
-- UPDATE profiles SET role = 'owner' WHERE id = auth.uid();
