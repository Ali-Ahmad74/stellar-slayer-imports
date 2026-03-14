
-- Fix overly permissive season_awards policies
DROP POLICY "Authenticated users can insert season_awards" ON public.season_awards;
DROP POLICY "Authenticated users can update season_awards" ON public.season_awards;

-- Only allow team owners (via season -> team) to insert/update awards
CREATE POLICY "Team owners can insert season_awards" ON public.season_awards FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.seasons s JOIN public.teams t ON t.id = s.team_id
  WHERE s.id = season_awards.season_id AND t.owner_user_id = auth.uid()
));

CREATE POLICY "Team owners can update season_awards" ON public.season_awards FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.seasons s JOIN public.teams t ON t.id = s.team_id
  WHERE s.id = season_awards.season_id AND t.owner_user_id = auth.uid()
));
