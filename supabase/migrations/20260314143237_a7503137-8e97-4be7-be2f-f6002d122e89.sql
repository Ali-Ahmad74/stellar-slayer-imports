
-- Add personal details to players table
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS date_of_birth date DEFAULT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS debut_date date DEFAULT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS jersey_number integer DEFAULT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS nationality text DEFAULT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;

-- Create rank_snapshots table to track daily rank history
CREATE TABLE IF NOT EXISTS public.rank_snapshots (
  id serial PRIMARY KEY,
  player_id integer NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  overall_rank integer NOT NULL,
  batting_rank integer,
  bowling_rank integer,
  fielding_rank integer,
  season_id integer REFERENCES public.seasons(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, snapshot_date)
);

ALTER TABLE public.rank_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rank_snapshots" ON public.rank_snapshots FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert rank_snapshots" ON public.rank_snapshots FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update rank_snapshots" ON public.rank_snapshots FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete rank_snapshots" ON public.rank_snapshots FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
