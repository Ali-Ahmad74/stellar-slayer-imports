ALTER TABLE public.batting_inputs ADD COLUMN IF NOT EXISTS balls_to_fifty integer DEFAULT NULL;
ALTER TABLE public.batting_inputs ADD COLUMN IF NOT EXISTS balls_to_hundred integer DEFAULT NULL;