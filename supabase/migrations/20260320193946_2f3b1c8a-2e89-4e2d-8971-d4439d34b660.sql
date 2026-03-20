-- Add DELETE RLS policies for season_awards and point_history
CREATE POLICY "Admins can delete season_awards"
ON public.season_awards
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete point_history"
ON public.point_history
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
