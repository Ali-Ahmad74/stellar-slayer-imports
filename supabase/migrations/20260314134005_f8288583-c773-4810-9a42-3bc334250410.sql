
-- =========================================================
-- Single-team model: Replace owner-based RLS with has_role('admin')
-- =========================================================

-- TEAMS: allow anyone to view, admins to manage
DROP POLICY IF EXISTS "Users can view their own team" ON public.teams;
DROP POLICY IF EXISTS "Users can update their own team" ON public.teams;
DROP POLICY IF EXISTS "Users can insert their own team" ON public.teams;
DROP POLICY IF EXISTS "Users can delete their own team" ON public.teams;

CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PLAYERS
DROP POLICY IF EXISTS "Team owners can insert players" ON public.players;
DROP POLICY IF EXISTS "Team owners can update players" ON public.players;
DROP POLICY IF EXISTS "Team owners can delete players" ON public.players;

CREATE POLICY "Admins can insert players" ON public.players FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update players" ON public.players FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete players" ON public.players FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MATCHES
DROP POLICY IF EXISTS "Team owners can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Team owners can update matches" ON public.matches;
DROP POLICY IF EXISTS "Team owners can delete matches" ON public.matches;

CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BATTING_INPUTS
DROP POLICY IF EXISTS "Team owners can insert batting_inputs" ON public.batting_inputs;
DROP POLICY IF EXISTS "Team owners can update batting_inputs" ON public.batting_inputs;
DROP POLICY IF EXISTS "Team owners can delete batting_inputs" ON public.batting_inputs;

CREATE POLICY "Admins can insert batting_inputs" ON public.batting_inputs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update batting_inputs" ON public.batting_inputs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete batting_inputs" ON public.batting_inputs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BOWLING_INPUTS
DROP POLICY IF EXISTS "Team owners can insert bowling_inputs" ON public.bowling_inputs;
DROP POLICY IF EXISTS "Team owners can update bowling_inputs" ON public.bowling_inputs;
DROP POLICY IF EXISTS "Team owners can delete bowling_inputs" ON public.bowling_inputs;

CREATE POLICY "Admins can insert bowling_inputs" ON public.bowling_inputs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bowling_inputs" ON public.bowling_inputs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bowling_inputs" ON public.bowling_inputs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FIELDING_INPUTS
DROP POLICY IF EXISTS "Team owners can insert fielding_inputs" ON public.fielding_inputs;
DROP POLICY IF EXISTS "Team owners can update fielding_inputs" ON public.fielding_inputs;
DROP POLICY IF EXISTS "Team owners can delete fielding_inputs" ON public.fielding_inputs;

CREATE POLICY "Admins can insert fielding_inputs" ON public.fielding_inputs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update fielding_inputs" ON public.fielding_inputs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete fielding_inputs" ON public.fielding_inputs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SEASONS
DROP POLICY IF EXISTS "Team owners can insert seasons" ON public.seasons;
DROP POLICY IF EXISTS "Team owners can update seasons" ON public.seasons;
DROP POLICY IF EXISTS "Team owners can delete seasons" ON public.seasons;

CREATE POLICY "Admins can insert seasons" ON public.seasons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seasons" ON public.seasons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seasons" ON public.seasons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SERIES
DROP POLICY IF EXISTS "Team owners can insert series" ON public.series;
DROP POLICY IF EXISTS "Team owners can update series" ON public.series;
DROP POLICY IF EXISTS "Team owners can delete series" ON public.series;

CREATE POLICY "Admins can insert series" ON public.series FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update series" ON public.series FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete series" ON public.series FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TOURNAMENTS
DROP POLICY IF EXISTS "Team owners can insert tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Team owners can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Team owners can delete tournaments" ON public.tournaments;

CREATE POLICY "Admins can insert tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tournaments" ON public.tournaments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SCORING_SETTINGS
DROP POLICY IF EXISTS "Team owners can update scoring_settings" ON public.scoring_settings;
DROP POLICY IF EXISTS "Team owners can insert scoring_settings" ON public.scoring_settings;

CREATE POLICY "Admins can update scoring_settings" ON public.scoring_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert scoring_settings" ON public.scoring_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MATCH_TEMPLATES
DROP POLICY IF EXISTS "Team owners can view match_templates" ON public.match_templates;
DROP POLICY IF EXISTS "Team owners can insert match_templates" ON public.match_templates;
DROP POLICY IF EXISTS "Team owners can update match_templates" ON public.match_templates;
DROP POLICY IF EXISTS "Team owners can delete match_templates" ON public.match_templates;

CREATE POLICY "Anyone can view match_templates" ON public.match_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert match_templates" ON public.match_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update match_templates" ON public.match_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete match_templates" ON public.match_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SEASON_AWARDS
DROP POLICY IF EXISTS "Team owners can insert season_awards" ON public.season_awards;
DROP POLICY IF EXISTS "Team owners can update season_awards" ON public.season_awards;

CREATE POLICY "Admins can insert season_awards" ON public.season_awards FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update season_awards" ON public.season_awards FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- POINT_HISTORY
DROP POLICY IF EXISTS "Team owners can insert point_history" ON public.point_history;
DROP POLICY IF EXISTS "Team owners can update point_history" ON public.point_history;

CREATE POLICY "Admins can insert point_history" ON public.point_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update point_history" ON public.point_history FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
