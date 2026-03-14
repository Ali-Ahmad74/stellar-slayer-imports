
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

-- Attendance table to explicitly track who played each match
CREATE TABLE IF NOT EXISTS public.match_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id integer NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match_attendance" ON public.match_attendance FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert match_attendance" ON public.match_attendance FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update match_attendance" ON public.match_attendance FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete match_attendance" ON public.match_attendance FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
