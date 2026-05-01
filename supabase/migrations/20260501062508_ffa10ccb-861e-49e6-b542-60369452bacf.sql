
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL CHECK (action IN ('create','update','delete')),
  entity_type text NOT NULL CHECK (entity_type IN ('player','match','series','season','tournament')),
  entity_id text NOT NULL,
  summary text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log (created_at DESC);
CREATE INDEX idx_admin_activity_log_entity ON public.admin_activity_log (entity_type, entity_id);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete activity log"
ON public.admin_activity_log FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
