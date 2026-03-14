
-- Add batting_position to batting_inputs
ALTER TABLE public.batting_inputs ADD COLUMN IF NOT EXISTS batting_position integer DEFAULT NULL;

-- Create match_partnerships table
CREATE TABLE IF NOT EXISTS public.match_partnerships (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  wicket_number integer NOT NULL,
  player1_id integer NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id integer NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  runs integer NOT NULL DEFAULT 0,
  balls integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for match_partnerships
ALTER TABLE public.match_partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match_partnerships" ON public.match_partnerships FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert match_partnerships" ON public.match_partnerships FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update match_partnerships" ON public.match_partnerships FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete match_partnerships" ON public.match_partnerships FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
