
-- 1. Create tournaments table
CREATE TABLE public.tournaments (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  venue text,
  tournament_type text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Team owners can insert tournaments" ON public.tournaments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = tournaments.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update tournaments" ON public.tournaments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = tournaments.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete tournaments" ON public.tournaments FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = tournaments.team_id AND owner_user_id = auth.uid()));

-- 2. Create point_history table
CREATE TABLE public.point_history (
  id serial PRIMARY KEY,
  player_id integer REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  batting_points integer NOT NULL DEFAULT 0,
  bowling_points integer NOT NULL DEFAULT 0,
  fielding_points integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, record_date)
);
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view point_history" ON public.point_history FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert point_history" ON public.point_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update point_history" ON public.point_history FOR UPDATE TO authenticated USING (true);

-- 3. Create player_stats view (aggregates batting, bowling, fielding inputs per player)
CREATE OR REPLACE VIEW public.player_stats AS
SELECT
  p.id AS player_id,
  COUNT(DISTINCT COALESCE(bi.match_id, boi.match_id, fi.match_id)) AS matches,
  COALESCE(SUM(bi.runs), 0) AS total_runs,
  COALESCE(SUM(bi.balls), 0) AS total_balls,
  COALESCE(SUM(bi.fours), 0) AS fours,
  COALESCE(SUM(bi.sixes), 0) AS sixes,
  COALESCE(SUM(CASE WHEN bi.out THEN 1 ELSE 0 END), 0) AS times_out,
  COALESCE(SUM(CASE WHEN bi.runs >= 30 AND bi.runs < 50 THEN 1 ELSE 0 END), 0) AS thirties,
  COALESCE(SUM(CASE WHEN bi.runs >= 50 AND bi.runs < 100 THEN 1 ELSE 0 END), 0) AS fifties,
  COALESCE(SUM(CASE WHEN bi.runs >= 100 THEN 1 ELSE 0 END), 0) AS hundreds,
  COALESCE(SUM(boi.balls), 0) AS bowling_balls,
  COALESCE(SUM(boi.runs_conceded), 0) AS runs_conceded,
  COALESCE(SUM(boi.wickets), 0) AS wickets,
  COALESCE(SUM(boi.maidens), 0) AS maidens,
  COALESCE(SUM(boi.wides), 0) AS wides,
  COALESCE(SUM(boi.no_balls), 0) AS no_balls,
  COALESCE(SUM(boi.fours_conceded), 0) AS fours_conceded,
  COALESCE(SUM(boi.sixes_conceded), 0) AS sixes_conceded,
  COALESCE(SUM(boi.dot_balls), 0) AS dot_balls,
  COALESCE(SUM(CASE WHEN boi.wickets >= 3 AND boi.wickets < 5 THEN 1 ELSE 0 END), 0) AS three_fers,
  COALESCE(SUM(CASE WHEN boi.wickets >= 5 THEN 1 ELSE 0 END), 0) AS five_fers,
  COALESCE(SUM(fi.catches), 0) AS catches,
  COALESCE(SUM(fi.runouts), 0) AS runouts,
  COALESCE(SUM(fi.stumpings), 0) AS stumpings,
  COALESCE(SUM(fi.dropped_catches), 0) AS dropped_catches
FROM public.players p
LEFT JOIN public.batting_inputs bi ON bi.player_id = p.id
LEFT JOIN public.bowling_inputs boi ON boi.player_id = p.id AND boi.match_id = COALESCE(bi.match_id, boi.match_id)
LEFT JOIN public.fielding_inputs fi ON fi.player_id = p.id AND fi.match_id = COALESCE(bi.match_id, boi.match_id, fi.match_id)
GROUP BY p.id;

-- 4. Update RLS policies to allow public READ access on key tables
-- Players
DROP POLICY "Team owners can view players" ON public.players;
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);

-- Seasons
DROP POLICY "Team owners can view seasons" ON public.seasons;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);

-- Series
DROP POLICY "Team owners can view series" ON public.series;
CREATE POLICY "Anyone can view series" ON public.series FOR SELECT USING (true);

-- Matches
DROP POLICY "Team owners can view matches" ON public.matches;
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);

-- Batting inputs
DROP POLICY "Team owners can view batting_inputs" ON public.batting_inputs;
CREATE POLICY "Anyone can view batting_inputs" ON public.batting_inputs FOR SELECT USING (true);

-- Bowling inputs
DROP POLICY "Team owners can view bowling_inputs" ON public.bowling_inputs;
CREATE POLICY "Anyone can view bowling_inputs" ON public.bowling_inputs FOR SELECT USING (true);

-- Fielding inputs
DROP POLICY "Team owners can view fielding_inputs" ON public.fielding_inputs;
CREATE POLICY "Anyone can view fielding_inputs" ON public.fielding_inputs FOR SELECT USING (true);

-- Add tournaments to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.point_history;

-- Indexes
CREATE INDEX idx_point_history_player_id ON public.point_history(player_id);
CREATE INDEX idx_tournaments_team_id ON public.tournaments(team_id);
