
-- 1. TEAMS TABLE
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  tagline text,
  watermark_enabled boolean NOT NULL DEFAULT false,
  watermark_handle text,
  watermark_position text NOT NULL DEFAULT 'bottom-right',
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own team" ON public.teams FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can update their own team" ON public.teams FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert their own team" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete their own team" ON public.teams FOR DELETE USING (auth.uid() = owner_user_id);

-- 2. USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- 3. PLAYERS
CREATE TABLE public.players (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Batsman',
  batting_style text,
  bowling_style text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view players" ON public.players FOR SELECT USING (EXISTS (SELECT 1 FROM public.teams WHERE id = players.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert players" ON public.players FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = players.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update players" ON public.players FOR UPDATE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = players.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete players" ON public.players FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = players.team_id AND owner_user_id = auth.uid()));

-- 4. SEASONS
CREATE TABLE public.seasons (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  year integer NOT NULL,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view seasons" ON public.seasons FOR SELECT USING (EXISTS (SELECT 1 FROM public.teams WHERE id = seasons.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert seasons" ON public.seasons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = seasons.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update seasons" ON public.seasons FOR UPDATE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = seasons.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete seasons" ON public.seasons FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = seasons.team_id AND owner_user_id = auth.uid()));

-- 5. SERIES
CREATE TABLE public.series (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  season_id integer REFERENCES public.seasons(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  venue text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view series" ON public.series FOR SELECT USING (EXISTS (SELECT 1 FROM public.teams WHERE id = series.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert series" ON public.series FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = series.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update series" ON public.series FOR UPDATE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = series.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete series" ON public.series FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = series.team_id AND owner_user_id = auth.uid()));

-- 6. MATCHES
CREATE TABLE public.matches (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  season_id integer REFERENCES public.seasons(id) ON DELETE SET NULL,
  series_id integer REFERENCES public.series(id) ON DELETE SET NULL,
  tournament_id integer,
  match_date date NOT NULL,
  overs integer NOT NULL DEFAULT 20,
  venue text,
  opponent_name text,
  our_score integer,
  opponent_score integer,
  result text,
  player_of_the_match_id integer REFERENCES public.players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view matches" ON public.matches FOR SELECT USING (EXISTS (SELECT 1 FROM public.teams WHERE id = matches.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert matches" ON public.matches FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = matches.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update matches" ON public.matches FOR UPDATE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = matches.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete matches" ON public.matches FOR DELETE USING (EXISTS (SELECT 1 FROM public.teams WHERE id = matches.team_id AND owner_user_id = auth.uid()));

-- 7. BATTING INPUTS
CREATE TABLE public.batting_inputs (
  id serial PRIMARY KEY,
  match_id integer REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  player_id integer REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  season_id integer REFERENCES public.seasons(id) ON DELETE SET NULL,
  runs integer NOT NULL DEFAULT 0,
  balls integer NOT NULL DEFAULT 0,
  fours integer NOT NULL DEFAULT 0,
  sixes integer NOT NULL DEFAULT 0,
  out boolean NOT NULL DEFAULT false,
  dismissal_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.batting_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view batting_inputs" ON public.batting_inputs FOR SELECT USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = batting_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert batting_inputs" ON public.batting_inputs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = batting_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update batting_inputs" ON public.batting_inputs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = batting_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete batting_inputs" ON public.batting_inputs FOR DELETE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = batting_inputs.match_id AND t.owner_user_id = auth.uid()));

-- 8. BOWLING INPUTS
CREATE TABLE public.bowling_inputs (
  id serial PRIMARY KEY,
  match_id integer REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  player_id integer REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  season_id integer REFERENCES public.seasons(id) ON DELETE SET NULL,
  balls integer NOT NULL DEFAULT 0,
  runs_conceded integer NOT NULL DEFAULT 0,
  wickets integer NOT NULL DEFAULT 0,
  maidens integer NOT NULL DEFAULT 0,
  wides integer NOT NULL DEFAULT 0,
  no_balls integer NOT NULL DEFAULT 0,
  fours_conceded integer NOT NULL DEFAULT 0,
  sixes_conceded integer NOT NULL DEFAULT 0,
  dot_balls integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bowling_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view bowling_inputs" ON public.bowling_inputs FOR SELECT USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = bowling_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert bowling_inputs" ON public.bowling_inputs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = bowling_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update bowling_inputs" ON public.bowling_inputs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = bowling_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete bowling_inputs" ON public.bowling_inputs FOR DELETE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = bowling_inputs.match_id AND t.owner_user_id = auth.uid()));

-- 9. FIELDING INPUTS
CREATE TABLE public.fielding_inputs (
  id serial PRIMARY KEY,
  match_id integer REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  player_id integer REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  season_id integer REFERENCES public.seasons(id) ON DELETE SET NULL,
  catches integer NOT NULL DEFAULT 0,
  runouts integer NOT NULL DEFAULT 0,
  stumpings integer NOT NULL DEFAULT 0,
  dropped_catches integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fielding_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view fielding_inputs" ON public.fielding_inputs FOR SELECT USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = fielding_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert fielding_inputs" ON public.fielding_inputs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = fielding_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update fielding_inputs" ON public.fielding_inputs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = fielding_inputs.match_id AND t.owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete fielding_inputs" ON public.fielding_inputs FOR DELETE USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.teams t ON t.id = m.team_id WHERE m.id = fielding_inputs.match_id AND t.owner_user_id = auth.uid()));

-- 10. SCORING SETTINGS
CREATE TABLE public.scoring_settings (
  id serial PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  batting_weight numeric NOT NULL DEFAULT 0.4,
  bowling_weight numeric NOT NULL DEFAULT 0.35,
  fielding_weight numeric NOT NULL DEFAULT 0.25,
  batting_run_points numeric NOT NULL DEFAULT 1,
  batting_four_points numeric NOT NULL DEFAULT 2,
  batting_six_points numeric NOT NULL DEFAULT 3,
  batting_thirty_bonus numeric NOT NULL DEFAULT 5,
  batting_fifty_bonus numeric NOT NULL DEFAULT 10,
  batting_hundred_bonus numeric NOT NULL DEFAULT 20,
  batting_sr_bonus_cap numeric NOT NULL DEFAULT 30,
  batting_sr_bonus_divisor numeric NOT NULL DEFAULT 5,
  bowling_wicket_points numeric NOT NULL DEFAULT 10,
  bowling_maiden_points numeric NOT NULL DEFAULT 5,
  bowling_threefer_bonus numeric NOT NULL DEFAULT 5,
  bowling_fivefer_bonus numeric NOT NULL DEFAULT 10,
  bowling_noball_penalty numeric NOT NULL DEFAULT 1,
  bowling_wide_penalty numeric NOT NULL DEFAULT 1,
  bowling_eco_target numeric NOT NULL DEFAULT 8,
  bowling_eco_bonus_multiplier numeric NOT NULL DEFAULT 3,
  bowling_eco_bonus_cap numeric NOT NULL DEFAULT 25,
  fielding_catch_points numeric NOT NULL DEFAULT 5,
  fielding_runout_points numeric NOT NULL DEFAULT 7,
  fielding_stumping_points numeric NOT NULL DEFAULT 7,
  fielding_dropped_catch_penalty numeric NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scoring_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scoring_settings" ON public.scoring_settings FOR SELECT USING (true);
CREATE POLICY "Team owners can update scoring_settings" ON public.scoring_settings FOR UPDATE USING (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = scoring_settings.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert scoring_settings" ON public.scoring_settings FOR INSERT WITH CHECK (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = scoring_settings.team_id AND owner_user_id = auth.uid()));
INSERT INTO public.scoring_settings (id) VALUES (1);

-- 11. MATCH TEMPLATES
CREATE TABLE public.match_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  player_ids integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, team_id)
);
ALTER TABLE public.match_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can view match_templates" ON public.match_templates FOR SELECT USING (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = match_templates.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can insert match_templates" ON public.match_templates FOR INSERT WITH CHECK (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = match_templates.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can update match_templates" ON public.match_templates FOR UPDATE USING (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = match_templates.team_id AND owner_user_id = auth.uid()));
CREATE POLICY "Team owners can delete match_templates" ON public.match_templates FOR DELETE USING (team_id IS NULL OR EXISTS (SELECT 1 FROM public.teams WHERE id = match_templates.team_id AND owner_user_id = auth.uid()));

-- 12. SEASON AWARDS
CREATE TABLE public.season_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id integer REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  award_type text NOT NULL,
  player_id integer REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  points numeric NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, award_type)
);
ALTER TABLE public.season_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view season_awards" ON public.season_awards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert season_awards" ON public.season_awards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update season_awards" ON public.season_awards FOR UPDATE TO authenticated USING (true);

-- 13. CREATE_TEAM_FOR_USER FUNCTION
CREATE OR REPLACE FUNCTION public.create_team_for_user(p_team_name text, p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_team_id uuid; v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO v_team_id FROM public.teams WHERE owner_user_id = v_user_id LIMIT 1;
  IF v_team_id IS NOT NULL THEN RAISE EXCEPTION 'User already owns a team' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.teams (name, description, owner_user_id) VALUES (p_team_name, p_description, v_user_id) RETURNING id INTO v_team_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.scoring_settings (team_id) VALUES (v_team_id);
  RETURN v_team_id;
END;
$$;

-- 14. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_match_templates_updated_at BEFORE UPDATE ON public.match_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scoring_settings_updated_at BEFORE UPDATE ON public.scoring_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. INDEXES
CREATE INDEX idx_players_team_id ON public.players(team_id);
CREATE INDEX idx_seasons_team_id ON public.seasons(team_id);
CREATE INDEX idx_series_team_id ON public.series(team_id);
CREATE INDEX idx_matches_team_id ON public.matches(team_id);
CREATE INDEX idx_matches_season_id ON public.matches(season_id);
CREATE INDEX idx_matches_series_id ON public.matches(series_id);
CREATE INDEX idx_batting_inputs_match_id ON public.batting_inputs(match_id);
CREATE INDEX idx_batting_inputs_player_id ON public.batting_inputs(player_id);
CREATE INDEX idx_batting_inputs_season_id ON public.batting_inputs(season_id);
CREATE INDEX idx_bowling_inputs_match_id ON public.bowling_inputs(match_id);
CREATE INDEX idx_bowling_inputs_player_id ON public.bowling_inputs(player_id);
CREATE INDEX idx_bowling_inputs_season_id ON public.bowling_inputs(season_id);
CREATE INDEX idx_fielding_inputs_match_id ON public.fielding_inputs(match_id);
CREATE INDEX idx_fielding_inputs_player_id ON public.fielding_inputs(player_id);
CREATE INDEX idx_fielding_inputs_season_id ON public.fielding_inputs(season_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 16. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seasons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.series;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batting_inputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowling_inputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fielding_inputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.season_awards;
