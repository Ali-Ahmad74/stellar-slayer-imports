
-- Make owner_user_id nullable for single-team model (no per-user ownership needed)
ALTER TABLE public.teams ALTER COLUMN owner_user_id DROP NOT NULL;
