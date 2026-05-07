
-- 1. player_achievements table
CREATE TABLE IF NOT EXISTS public.player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id integer NOT NULL,
  match_id integer NOT NULL,
  achievement_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, match_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON public.player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_match ON public.player_achievements(match_id);

ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player_achievements"
  ON public.player_achievements FOR SELECT USING (true);
CREATE POLICY "Admins can insert player_achievements"
  ON public.player_achievements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update player_achievements"
  ON public.player_achievements FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete player_achievements"
  ON public.player_achievements FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. potm_locked flag on matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS potm_locked boolean NOT NULL DEFAULT false;

-- Mark existing manually-set POTMs as locked so backfill won't overwrite them
UPDATE public.matches SET potm_locked = true WHERE player_of_the_match_id IS NOT NULL;

-- 3. Recompute function (achievements + POTM for one match)
CREATE OR REPLACE FUNCTION public.recompute_match_derived(p_match_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  best_player_id integer;
  best_score numeric := -1;
  rec record;
  score numeric;
BEGIN
  -- Wipe stale achievements for this match
  DELETE FROM player_achievements WHERE match_id = p_match_id;

  -- Insert 4fer / 5fer based on per-bowler wickets in match
  INSERT INTO player_achievements (player_id, match_id, achievement_type, details)
  SELECT player_id, p_match_id,
    CASE WHEN total_wkts >= 5 THEN 'fivefer' ELSE 'fourfer' END,
    jsonb_build_object('wickets', total_wkts, 'runs_conceded', total_runs)
  FROM (
    SELECT player_id, SUM(wickets)::int AS total_wkts, SUM(runs_conceded)::int AS total_runs
    FROM bowling_inputs WHERE match_id = p_match_id
    GROUP BY player_id
  ) agg
  WHERE total_wkts >= 4
  ON CONFLICT (player_id, match_id, achievement_type) DO NOTHING;

  -- "Possible hat-trick": 3+ wickets in one match (no ball-by-ball)
  INSERT INTO player_achievements (player_id, match_id, achievement_type, details)
  SELECT player_id, p_match_id, 'hatrick_possible',
    jsonb_build_object('wickets', total_wkts)
  FROM (
    SELECT player_id, SUM(wickets)::int AS total_wkts
    FROM bowling_inputs WHERE match_id = p_match_id
    GROUP BY player_id
  ) agg
  WHERE total_wkts >= 3
  ON CONFLICT (player_id, match_id, achievement_type) DO NOTHING;

  -- POTM: skip if locked
  IF EXISTS (SELECT 1 FROM matches WHERE id = p_match_id AND potm_locked = true) THEN
    RETURN;
  END IF;

  best_player_id := NULL;
  best_score := -1;

  FOR rec IN
    SELECT
      COALESCE(b.player_id, bo.player_id, f.player_id) AS player_id,
      COALESCE(b.runs, 0) AS runs,
      COALESCE(b.balls, 0) AS balls,
      COALESCE(b.fours, 0) AS fours,
      COALESCE(b.sixes, 0) AS sixes,
      COALESCE(b.out, false) AS out,
      COALESCE(bo.wickets, 0) AS wickets,
      COALESCE(bo.runs_conceded, 0) AS runs_conceded,
      COALESCE(bo.balls, 0) AS bowl_balls,
      COALESCE(bo.maidens, 0) AS maidens,
      COALESCE(f.catches, 0) AS catches,
      COALESCE(f.runouts, 0) AS runouts,
      COALESCE(f.stumpings, 0) AS stumpings
    FROM (SELECT player_id, SUM(runs)::int runs, SUM(balls)::int balls, SUM(fours)::int fours,
                 SUM(sixes)::int sixes, BOOL_OR(out) out FROM batting_inputs WHERE match_id = p_match_id GROUP BY player_id) b
    FULL OUTER JOIN (SELECT player_id, SUM(wickets)::int wickets, SUM(runs_conceded)::int runs_conceded,
                            SUM(balls)::int balls, SUM(maidens)::int maidens
                     FROM bowling_inputs WHERE match_id = p_match_id GROUP BY player_id) bo
      ON b.player_id = bo.player_id
    FULL OUTER JOIN (SELECT player_id, SUM(catches)::int catches, SUM(runouts)::int runouts,
                            SUM(stumpings)::int stumpings
                     FROM fielding_inputs WHERE match_id = p_match_id GROUP BY player_id) f
      ON COALESCE(b.player_id, bo.player_id) = f.player_id
  LOOP
    score := rec.runs + (rec.sixes * 2) + (rec.fours * 0.5)
           + CASE WHEN rec.balls >= 10 AND (rec.runs::numeric / rec.balls) * 100 > 150 THEN 10 ELSE 0 END
           + (rec.wickets * 20)
           + CASE WHEN rec.bowl_balls >= 12 AND (rec.runs_conceded::numeric / (rec.bowl_balls::numeric / 6)) < 8 THEN 10 ELSE 0 END
           + (rec.maidens * 5)
           + (rec.catches * 5) + (rec.runouts * 8) + (rec.stumpings * 6);

    IF score > best_score THEN
      best_score := score;
      best_player_id := rec.player_id;
    END IF;
  END LOOP;

  IF best_player_id IS NOT NULL AND best_score > 0 THEN
    UPDATE matches SET player_of_the_match_id = best_player_id
    WHERE id = p_match_id AND potm_locked = false;
  END IF;
END;
$$;

-- 4. Trigger function to fire recompute
CREATE OR REPLACE FUNCTION public.trg_recompute_match_derived()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m_id integer;
BEGIN
  m_id := COALESCE(NEW.match_id, OLD.match_id);
  IF m_id IS NOT NULL THEN
    PERFORM recompute_match_derived(m_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS bowling_inputs_recompute ON public.bowling_inputs;
CREATE TRIGGER bowling_inputs_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.bowling_inputs
  FOR EACH ROW EXECUTE FUNCTION trg_recompute_match_derived();

DROP TRIGGER IF EXISTS batting_inputs_recompute ON public.batting_inputs;
CREATE TRIGGER batting_inputs_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.batting_inputs
  FOR EACH ROW EXECUTE FUNCTION trg_recompute_match_derived();

DROP TRIGGER IF EXISTS fielding_inputs_recompute ON public.fielding_inputs;
CREATE TRIGGER fielding_inputs_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.fielding_inputs
  FOR EACH ROW EXECUTE FUNCTION trg_recompute_match_derived();

-- 5. Backfill all existing matches
DO $$
DECLARE m_id integer;
BEGIN
  FOR m_id IN SELECT id FROM matches LOOP
    PERFORM recompute_match_derived(m_id);
  END LOOP;
END $$;
