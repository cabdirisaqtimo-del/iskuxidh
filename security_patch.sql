-- ==========================================
-- SECURITY PATCH: Prevent Unauthorized Updates
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create a function ensuring users can't achieve 'admin' role or verify themselves
CREATE OR REPLACE FUNCTION public.protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ROLE is being changed
  -- (If role was 'seeker' and new role is 'admin', BLOCK IT)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You are not allowed to change your role.';
  END IF;

  -- Check if IS_VERIFIED is being changed
  -- (If verified was false and new is true, BLOCK IT)
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
     RAISE EXCEPTION 'You are not allowed to verify yourself.';
  END IF;

  -- Note: We allow payment_status changes for now so the app works,
  -- but ideally this should also be blocked in a version 2.0 with backend API.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind this trigger to the profiles table
DROP TRIGGER IF EXISTS on_profile_update_protect ON profiles;
CREATE TRIGGER on_profile_update_protect
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_columns();

-- 3. Confirm Patch
SELECT 'Security Patch Applied: Role and Verification columns are now locked.' as status;
