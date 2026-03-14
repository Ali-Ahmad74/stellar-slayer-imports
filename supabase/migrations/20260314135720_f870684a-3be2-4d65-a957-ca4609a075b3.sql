
-- Function: claim admin role if no admin exists yet
-- Called from frontend after signup/signin
CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_has_any_admin boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if any admin exists
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) INTO v_has_any_admin;

  IF NOT v_has_any_admin THEN
    -- Grant admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Also set owner on the team if not set
    UPDATE public.teams
    SET owner_user_id = v_user_id
    WHERE owner_user_id IS NULL;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;
