-- SQL Function to delete a user account from auth.users
-- This function must be run in Supabase SQL Editor with proper permissions

-- Create the function to delete user account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with the privileges of the function creator
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users (this will cascade delete related auth data)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Note: The profile and related data should be deleted BEFORE calling this function
  -- because once the auth user is deleted, the function cannot run anymore
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account() IS 'Allows authenticated users to delete their own account from auth.users table';
