
-- Fix security definer view - recreate with security_invoker
DROP VIEW IF EXISTS public.player_stats;
CREATE VIEW public.player_stats WITH (security_invoker=on) AS
SELECT
  p.id AS player_id,
  (SELECT COUNT(DISTINCT m.id) FROM public.matches m
   WHERE m.id IN (
     SELECT match_id FROM public.batting_inputs WHERE player_id = p.id
     UNION SELECT match_id FROM public.bowling_inputs WHERE player_id = p.id
     UNION SELECT match_id FROM public.fielding_inputs WHERE player_id = p.id
   )
  ) AS matches,
  COALESCE((SELECT SUM(runs) FROM public.batting_inputs WHERE player_id = p.id), 0) AS total_runs,
  COALESCE((SELECT SUM(balls) FROM public.batting_inputs WHERE player_id = p.id), 0) AS total_balls,
  COALESCE((SELECT SUM(fours) FROM public.batting_inputs WHERE player_id = p.id), 0) AS fours,
  COALESCE((SELECT SUM(sixes) FROM public.batting_inputs WHERE player_id = p.id), 0) AS sixes,
  COALESCE((SELECT SUM(CASE WHEN out THEN 1 ELSE 0 END) FROM public.batting_inputs WHERE player_id = p.id), 0) AS times_out,
  COALESCE((SELECT SUM(CASE WHEN runs >= 30 AND runs < 50 THEN 1 ELSE 0 END) FROM public.batting_inputs WHERE player_id = p.id), 0) AS thirties,
  COALESCE((SELECT SUM(CASE WHEN runs >= 50 AND runs < 100 THEN 1 ELSE 0 END) FROM public.batting_inputs WHERE player_id = p.id), 0) AS fifties,
  COALESCE((SELECT SUM(CASE WHEN runs >= 100 THEN 1 ELSE 0 END) FROM public.batting_inputs WHERE player_id = p.id), 0) AS hundreds,
  COALESCE((SELECT SUM(balls) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS bowling_balls,
  COALESCE((SELECT SUM(runs_conceded) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS runs_conceded,
  COALESCE((SELECT SUM(wickets) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS wickets,
  COALESCE((SELECT SUM(maidens) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS maidens,
  COALESCE((SELECT SUM(wides) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS wides,
  COALESCE((SELECT SUM(no_balls) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS no_balls,
  COALESCE((SELECT SUM(fours_conceded) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS fours_conceded,
  COALESCE((SELECT SUM(sixes_conceded) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS sixes_conceded,
  COALESCE((SELECT SUM(dot_balls) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS dot_balls,
  COALESCE((SELECT SUM(CASE WHEN wickets >= 3 AND wickets < 5 THEN 1 ELSE 0 END) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS three_fers,
  COALESCE((SELECT SUM(CASE WHEN wickets >= 5 THEN 1 ELSE 0 END) FROM public.bowling_inputs WHERE player_id = p.id), 0) AS five_fers,
  COALESCE((SELECT SUM(catches) FROM public.fielding_inputs WHERE player_id = p.id), 0) AS catches,
  COALESCE((SELECT SUM(runouts) FROM public.fielding_inputs WHERE player_id = p.id), 0) AS runouts,
  COALESCE((SELECT SUM(stumpings) FROM public.fielding_inputs WHERE player_id = p.id), 0) AS stumpings,
  COALESCE((SELECT SUM(dropped_catches) FROM public.fielding_inputs WHERE player_id = p.id), 0) AS dropped_catches
FROM public.players p;

-- Fix point_history permissive policies - tie to team ownership via player
DROP POLICY "Authenticated can insert point_history" ON public.point_history;
DROP POLICY "Authenticated can update point_history" ON public.point_history;
CREATE POLICY "Team owners can insert point_history" ON public.point_history FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.players pl JOIN public.teams t ON t.id = pl.team_id
  WHERE pl.id = point_history.player_id AND t.owner_user_id = auth.uid()
));
CREATE POLICY "Team owners can update point_history" ON public.point_history FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.players pl JOIN public.teams t ON t.id = pl.team_id
  WHERE pl.id = point_history.player_id AND t.owner_user_id = auth.uid()
));
