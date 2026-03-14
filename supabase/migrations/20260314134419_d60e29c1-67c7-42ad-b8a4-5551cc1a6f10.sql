
-- Create storage buckets for player photos and team logos
INSERT INTO storage.buckets (id, name, public) VALUES ('player-photos', 'player-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('team-logos', 'team-logos', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for player-photos bucket
CREATE POLICY "Anyone can view player photos" ON storage.objects FOR SELECT USING (bucket_id = 'player-photos');
CREATE POLICY "Admins can upload player photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update player photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete player photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));

-- RLS policies for team-logos bucket
CREATE POLICY "Anyone can view team logos" ON storage.objects FOR SELECT USING (bucket_id = 'team-logos');
CREATE POLICY "Admins can upload team logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update team logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete team logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));
