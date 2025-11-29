-- =====================================================
-- NEW APPROACH: Separate Operators Table
-- =====================================================
-- This creates a dedicated table for operators without using auth.users
-- Operators are linked to owners via owner_id foreign key

-- 1. Create operators table
CREATE TABLE IF NOT EXISTS public.operators (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_lots INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$')
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operators_username ON public.operators(username);
CREATE INDEX IF NOT EXISTS idx_operators_owner_id ON public.operators(owner_id);
CREATE INDEX IF NOT EXISTS idx_operators_assigned_lots ON public.operators USING GIN(assigned_lots);

-- 3. Enable Row Level Security
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Owners can view their own operators
CREATE POLICY "Owners can view their own operators"
  ON public.operators
  FOR SELECT
  USING (owner_id = auth.uid());

-- 5. RLS Policy: Owners can insert their own operators
CREATE POLICY "Owners can insert their own operators"
  ON public.operators
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- 6. RLS Policy: Owners can update their own operators
CREATE POLICY "Owners can update their own operators"
  ON public.operators
  FOR UPDATE
  USING (owner_id = auth.uid());

-- 7. RLS Policy: Owners can delete their own operators
CREATE POLICY "Owners can delete their own operators"
  ON public.operators
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- FUNCTION: Create operator (NEW SIMPLE APPROACH)
-- =====================================================
CREATE OR REPLACE FUNCTION create_operator_simple(
  p_username TEXT,
  p_full_name TEXT,
  p_password_hash TEXT,
  p_owner_id UUID,
  p_lot_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_operator_id INTEGER;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.operators WHERE LOWER(username) = LOWER(p_username)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Username "' || p_username || '" already exists. Please choose a different username.'
    );
  END IF;
  
  -- Insert operator
  INSERT INTO public.operators (
    username,
    password_hash,
    full_name,
    owner_id,
    assigned_lots
  ) VALUES (
    p_username,
    p_password_hash,
    p_full_name,
    p_owner_id,
    ARRAY[p_lot_id]
  )
  RETURNING id INTO v_operator_id;
  
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

GRANT EXECUTE ON FUNCTION create_operator_simple TO authenticated;

-- =====================================================
-- FUNCTION: Verify operator login credentials
-- =====================================================
CREATE OR REPLACE FUNCTION verify_operator_login(
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS JSON AS $$
DECLARE
  v_operator_id INTEGER;
  v_full_name TEXT;
  v_owner_id UUID;
  v_assigned_lots INTEGER[];
BEGIN
  -- Get operator data
  SELECT id, full_name, owner_id, assigned_lots
  INTO v_operator_id, v_full_name, v_owner_id, v_assigned_lots
  FROM public.operators
  WHERE LOWER(username) = LOWER(p_username)
    AND password_hash = p_password_hash
    AND is_active = TRUE;
  
  -- Check if operator exists
  IF v_operator_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid username or password'
    );
  END IF;
  
  -- Update last login
  UPDATE public.operators
  SET last_login = NOW()
  WHERE id = v_operator_id;
  
  RETURN json_build_object(
    'success', true,
    'operator', json_build_object(
      'id', v_operator_id,
      'username', p_username,
      'full_name', v_full_name,
      'owner_id', v_owner_id,
      'assigned_lots', v_assigned_lots
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_operator_login TO authenticated, anon;

-- =====================================================
-- FUNCTION: Update operator
-- =====================================================
CREATE OR REPLACE FUNCTION update_operator_simple(
  p_operator_id INTEGER,
  p_username TEXT,
  p_full_name TEXT,
  p_password_hash TEXT DEFAULT NULL,
  p_assigned_lots INTEGER[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get operator's owner_id
  SELECT owner_id INTO v_owner_id
  FROM public.operators
  WHERE id = p_operator_id;
  
  -- Check if current user is the owner
  IF v_owner_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Check if new username conflicts with another operator
  IF EXISTS (
    SELECT 1 FROM public.operators 
    WHERE LOWER(username) = LOWER(p_username) 
    AND id != p_operator_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Username already exists'
    );
  END IF;
  
  -- Update operator
  UPDATE public.operators
  SET 
    username = p_username,
    full_name = p_full_name,
    password_hash = COALESCE(p_password_hash, password_hash),
    assigned_lots = COALESCE(p_assigned_lots, assigned_lots),
    updated_at = NOW()
  WHERE id = p_operator_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Operator updated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_operator_simple TO authenticated;

-- =====================================================
-- FUNCTION: Delete operator
-- =====================================================
CREATE OR REPLACE FUNCTION delete_operator_simple(p_operator_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get operator's owner_id
  SELECT owner_id INTO v_owner_id
  FROM public.operators
  WHERE id = p_operator_id;
  
  -- Check if current user is the owner
  IF v_owner_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Delete operator
  DELETE FROM public.operators WHERE id = p_operator_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Operator deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_operator_simple TO authenticated;

-- =====================================================
-- CLEANUP: Remove old operator data from profiles table
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_operator_data()
RETURNS JSON AS $$
DECLARE
  v_deleted_profiles INTEGER;
  v_deleted_auth INTEGER;
BEGIN
  -- Delete operator profiles from profiles table
  DELETE FROM public.profiles WHERE role = 'operator';
  GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;
  
  -- Delete operator auth users
  DELETE FROM auth.users WHERE email LIKE '%@operator.parkintel.local';
  GET DIAGNOSTICS v_deleted_auth = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'deleted_profiles', v_deleted_profiles,
    'deleted_auth_users', v_deleted_auth,
    'message', 'Old operator data cleaned up'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_old_operator_data TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Verify table was created
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'operators';

-- Verify functions were created
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%operator%simple%';

-- Check RLS policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'operators';

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 1. Run this entire SQL file in Supabase SQL Editor
-- 2. Run cleanup: SELECT cleanup_old_operator_data();
-- 3. Update your dashboard code to use the new functions
-- 4. Test creating operators from the dashboard

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.operators IS 'Dedicated table for parking lot operators';
COMMENT ON COLUMN public.operators.username IS 'Unique username for operator login';
COMMENT ON COLUMN public.operators.password_hash IS 'Hashed password (use bcrypt in application)';
COMMENT ON COLUMN public.operators.owner_id IS 'Foreign key to the owner who created this operator';
COMMENT ON COLUMN public.operators.assigned_lots IS 'Array of parking lot IDs assigned to this operator';
