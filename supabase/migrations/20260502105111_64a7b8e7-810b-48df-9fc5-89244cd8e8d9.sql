-- 1) Lock down vapid_keys: remove public SELECT, admin-only access
DROP POLICY IF EXISTS "Anyone can read vapid public key" ON public.vapid_keys;

-- "Admins can manage vapid_keys" already exists for ALL with admin check; keep it.
-- Ensure no anon/auth direct table grants leak the private key
REVOKE SELECT ON public.vapid_keys FROM anon, authenticated;

-- 2) Hide owner_user_id on teams from public reads via column-level grants.
-- Revoke broad SELECT then grant only safe columns to anon + authenticated.
REVOKE SELECT ON public.teams FROM anon, authenticated;

GRANT SELECT (
  id, name, description, logo_url, tagline,
  watermark_enabled, watermark_handle, watermark_position,
  created_at, updated_at
) ON public.teams TO anon, authenticated;
