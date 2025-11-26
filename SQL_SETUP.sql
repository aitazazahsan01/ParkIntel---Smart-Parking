-- =====================================================
-- ParkIntel Database Schema - Username & Password Setup
-- =====================================================
-- Run these commands in your Supabase SQL Editor

-- 1. Add username and password columns to profiles table
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_verified BOOLEAN DEFAULT FALSE;

-- 2. Create index for faster username lookups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON public.profiles(username) 
WHERE username IS NOT NULL;

-- 3. Add constraint to ensure username format (alphanumeric, underscore, dash)
-- =====================================================
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format 
CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$');

-- 4. Add comment to columns for documentation
-- =====================================================
COMMENT ON COLUMN public.profiles.username IS 'Unique username for login (3-30 characters, alphanumeric with _ and -)';
COMMENT ON COLUMN public.profiles.password_hash IS 'Hashed password for username/password login';
COMMENT ON COLUMN public.profiles.has_password IS 'Indicates if user has set up password authentication';
COMMENT ON COLUMN public.profiles.last_password_change IS 'Timestamp of last password change';
COMMENT ON COLUMN public.profiles.account_verified IS 'Indicates if user account is verified';

-- 5. Create function to check username availability
-- =====================================================
CREATE OR REPLACE FUNCTION check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(p_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to update username
-- =====================================================
CREATE OR REPLACE FUNCTION update_username(
  p_user_id UUID,
  p_username TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if username is available
  IF NOT check_username_available(p_username) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Username already taken'
    );
  END IF;

  -- Update username
  UPDATE public.profiles
  SET username = p_username,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Username updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to set password (stores hash)
-- =====================================================
CREATE OR REPLACE FUNCTION set_user_password(
  p_user_id UUID,
  p_password_hash TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.profiles
  SET password_hash = p_password_hash,
      has_password = TRUE,
      last_password_change = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Password set successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to verify login credentials
-- =====================================================
CREATE OR REPLACE FUNCTION verify_login_credentials(
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_stored_hash TEXT;
  v_role TEXT;
  v_email TEXT;
  v_full_name TEXT;
BEGIN
  -- Get user data
  SELECT id, password_hash, role, email, full_name
  INTO v_user_id, v_stored_hash, v_role, v_email, v_full_name
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
    AND has_password = TRUE;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid username or password'
    );
  END IF;

  -- Verify password hash
  IF v_stored_hash = p_password_hash THEN
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user_id,
        'username', p_username,
        'role', v_role,
        'email', v_email,
        'full_name', v_full_name
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid username or password'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update RLS policies to include username/password login
-- =====================================================
-- Allow users to read their own profile by username
CREATE POLICY "Users can view profile by username"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    username IS NOT NULL
  );

-- 10. Create sessions table for username/password authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON public.user_sessions(session_token) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON public.user_sessions(user_id) 
WHERE is_active = TRUE;

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- 11. Create function to create session
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS JSON AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.user_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_user_id,
    p_session_token,
    p_ip_address,
    p_user_agent,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'success', true,
    'session_id', v_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to validate session
-- =====================================================
CREATE OR REPLACE FUNCTION validate_session(
  p_session_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_session_id UUID;
BEGIN
  -- Get session and update last activity
  UPDATE public.user_sessions s
  SET last_activity = NOW()
  FROM public.profiles p
  WHERE s.session_token = p_session_token
    AND s.is_active = TRUE
    AND s.expires_at > NOW()
    AND s.user_id = p.id
  RETURNING s.user_id, p.role, s.id
  INTO v_user_id, v_role, v_session_id;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid or expired session'
    );
  END IF;

  RETURN json_build_object(
    'valid', true,
    'user_id', v_user_id,
    'role', v_role,
    'session_id', v_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to logout (invalidate session)
-- =====================================================
CREATE OR REPLACE FUNCTION logout_session(
  p_session_token TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = FALSE
  WHERE session_token = p_session_token;

  RETURN json_build_object(
    'success', true,
    'message', 'Logged out successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to cleanup expired sessions (run periodically)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < NOW() OR is_active = FALSE;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Grant necessary permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION check_username_available TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_username TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_credentials TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_session TO authenticated, anon;
GRANT EXECUTE ON FUNCTION logout_session TO authenticated, anon;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check if columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('username', 'password_hash', 'has_password', 'last_password_change', 'account_verified');

-- Check if functions were created
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name LIKE '%user%' OR routine_name LIKE '%session%' OR routine_name LIKE '%password%';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Check if username is available
-- SELECT check_username_available('johndoe');

-- Example 2: Set username for a user
-- SELECT update_username('user-uuid-here', 'johndoe');

-- Example 3: Set password for a user (hash should be generated in your app)
-- SELECT set_user_password('user-uuid-here', 'hashed_password_here');

-- Example 4: Verify login credentials
-- SELECT verify_login_credentials('johndoe', 'hashed_password_here');

-- Example 5: Create a session after successful login
-- SELECT create_user_session('user-uuid-here', 'random_session_token', '192.168.1.1'::INET, 'Mozilla/5.0...');

-- Example 6: Validate a session
-- SELECT validate_session('session_token_here');

-- Example 7: Logout a session
-- SELECT logout_session('session_token_here');

-- =====================================================
-- END OF SCRIPT
-- =====================================================
