-- Add operator creation function
-- Your schema already has assigned_lots column, so we only need the function
-- Run this in Supabase SQL Editor

-- Create function to create operator profile
CREATE OR REPLACE FUNCTION create_operator(
  p_username TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_lot_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_operator_id UUID;
  v_operator_email TEXT;
BEGIN
  -- Create email from username
  v_operator_email := LOWER(p_username) || '@operator.parkintel.local';
  
  -- FIRST: Clean up any orphaned auth users for this username
  DELETE FROM auth.users 
  WHERE email = v_operator_email 
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = v_operator_email);
  
  -- THEN: Check if username already exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(p_username)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Username "' || p_username || '" already exists. Please choose a different username.'
    );
  END IF;
  
  -- Check if email already exists in auth.users (after cleanup)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_operator_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An operator with this username already exists in the authentication system.'
    );
  END IF;
  
  -- Generate UUID for operator - ensure it's unique in BOTH tables
  LOOP
    v_operator_id := gen_random_uuid();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_operator_id)
          AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_operator_id);
  END LOOP;
  
  -- Create auth user first with pre-generated UUID
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_operator_id,
      'authenticated',
      'authenticated',
      v_operator_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_full_name, 'username', p_username),
      false,
      '',
      ''
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Auth user creation failed - duplicate detected. Please try again or contact support.'
      );
  END;
  
  -- Insert operator profile with the same UUID
  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      password_hash,
      role,
      assigned_lots,
      email
    ) VALUES (
      v_operator_id,
      p_username,
      p_full_name,
      p_password,
      'operator',
      ARRAY[p_lot_id],
      v_operator_email
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Rollback auth user if profile creation fails
      DELETE FROM auth.users WHERE id = v_operator_id;
      RETURN json_build_object(
        'success', false,
        'error', 'Profile creation failed - username "' || p_username || '" may already exist. Please choose a different username.'
      );
  END;
  
  RETURN json_build_object(
    'success', true,
    'operator_id', v_operator_id,
    'message', 'Operator created successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_operator TO authenticated;

-- =====================================================
-- CLEANUP FUNCTION: Remove existing operator if needed
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_operator(p_username TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Find the user ID from profiles (case insensitive)
  SELECT id INTO v_user_id 
  FROM public.profiles 
  WHERE LOWER(username) = LOWER(p_username);
  
  -- If found in profiles, delete it
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = v_user_id;
    v_deleted_count := v_deleted_count + 1;
  END IF;
  
  -- Also check auth.users by email pattern
  v_email := LOWER(p_username) || '@operator.parkintel.local';
  DELETE FROM auth.users WHERE email = v_email;
  
  IF v_deleted_count > 0 THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Operator deleted successfully',
      'deleted_count', v_deleted_count
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Operator not found with username: ' || p_username
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_operator TO authenticated;

-- =====================================================
-- FORCE CLEANUP: Remove ALL operator data for debugging
-- =====================================================
CREATE OR REPLACE FUNCTION force_cleanup_all_operators()
RETURNS JSON AS $$
DECLARE
  v_deleted_profiles INTEGER;
  v_deleted_auth INTEGER;
BEGIN
  -- Delete all operator profiles
  DELETE FROM public.profiles WHERE role = 'operator';
  GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;
  
  -- Delete all operator auth users (by email pattern)
  DELETE FROM auth.users WHERE email LIKE '%@operator.parkintel.local';
  GET DIAGNOSTICS v_deleted_auth = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'deleted_profiles', v_deleted_profiles,
    'deleted_auth_users', v_deleted_auth,
    'message', 'All operators cleaned up'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION force_cleanup_all_operators TO authenticated;

-- =====================================================
-- DIAGNOSTIC QUERIES: Run these to investigate the issue
-- =====================================================
-- Check what's in profiles table
-- SELECT id, username, email, role FROM public.profiles WHERE role = 'operator' OR username IN ('Ahmed', 'Ali', 'Hasnain');

-- Check what's in auth.users table
-- SELECT id, email, created_at FROM auth.users WHERE email LIKE '%@operator.parkintel.local';

-- Check for orphaned auth users (auth.users without profiles)
-- SELECT u.id, u.email FROM auth.users u 
-- LEFT JOIN public.profiles p ON u.id = p.id 
-- WHERE u.email LIKE '%@operator.parkintel.local' AND p.id IS NULL;

-- =====================================================
-- FIX FUNCTION: Clean orphaned auth users
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS JSON AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete auth.users that don't have corresponding profiles
  DELETE FROM auth.users u
  WHERE u.email LIKE '%@operator.parkintel.local'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'deleted_orphaned_auth_users', v_deleted,
    'message', 'Cleaned up orphaned auth users'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_orphaned_auth_users TO authenticated;

-- =====================================================
-- TO FIX YOUR CURRENT ERROR, RUN THESE IN ORDER:
-- =====================================================
-- 1. First, clean up orphaned auth users
-- SELECT cleanup_orphaned_auth_users();

-- 2. Then, force cleanup all operators
-- SELECT force_cleanup_all_operators();

-- 3. Verify everything is clean
-- SELECT * FROM public.profiles WHERE role = 'operator';
-- SELECT * FROM auth.users WHERE email LIKE '%@operator.parkintel.local';

-- 4. Now try creating operators again from your dashboard

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_operator';

-- =====================================================
-- EXPLANATION:
-- =====================================================
-- This function creates BOTH auth user AND profile:
-- 1. Checks if username/email already exists
-- 2. Creates user in auth.users table with encrypted password
-- 3. Creates matching profile in public.profiles table
-- 4. Uses the SAME UUID for both (satisfies foreign key constraint)
--
-- Features:
-- - Auto-generated UUID that works with foreign key
-- - Username validation (must be unique)
-- - Password encrypted with bcrypt (gen_salt('bf'))
-- - Role set to 'operator'
-- - assigned_lots array with the lot ID
-- - Email auto-generated as username@operator.local
--
-- Returns JSON with success status and error message if any
-- =====================================================
