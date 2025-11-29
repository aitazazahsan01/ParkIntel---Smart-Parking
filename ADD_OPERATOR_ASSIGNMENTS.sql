-- Add assigned_lots column to profiles table for operators
-- Run this in Supabase SQL Editor

-- 1. Add assigned_lots column (array of lot IDs)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assigned_lots integer[] DEFAULT '{}';

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_lots 
ON public.profiles USING GIN (assigned_lots);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.profiles.assigned_lots IS 'Array of parking lot IDs assigned to this operator';

-- 4. Create function to create operator profile
CREATE OR REPLACE FUNCTION create_operator(
  p_username TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_lot_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_operator_id UUID;
BEGIN
  -- Generate a new UUID
  v_operator_id := gen_random_uuid();
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Username already exists'
    );
  END IF;
  
  -- Insert new operator profile
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
    p_username || '@operator.local'
  );
  
  RETURN json_build_object(
    'success', true,
    'operator_id', v_operator_id,
    'message', 'Operator created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_operator TO authenticated;

-- 4. Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'assigned_lots';

-- 5. Example: Assign an operator to multiple lots
-- UPDATE public.profiles 
-- SET assigned_lots = ARRAY[1, 2, 3]
-- WHERE id = 'operator-uuid-here';

-- 6. Example: Check operators for a specific lot
-- SELECT id, username, full_name, assigned_lots
-- FROM public.profiles
-- WHERE role = 'operator'
-- AND 1 = ANY(assigned_lots);

-- =====================================================
-- EXPLANATION:
-- =====================================================
-- assigned_lots: Array of parking lot IDs
--   - Empty array {} means not assigned to any lot
--   - [1, 2, 3] means assigned to lots with ID 1, 2, and 3
--   - Operators can be assigned to multiple lots
--   - Owners assign operators through the dashboard
-- =====================================================
