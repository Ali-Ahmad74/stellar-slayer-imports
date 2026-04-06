
-- Table for storing push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their subscription
CREATE POLICY "Anyone can subscribe to push" ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Anyone can view their own subscription by endpoint
CREATE POLICY "Anyone can view push_subscriptions" ON public.push_subscriptions
  FOR SELECT USING (true);

-- Anyone can delete their own subscription
CREATE POLICY "Anyone can unsubscribe" ON public.push_subscriptions
  FOR DELETE USING (true);

-- Table to store VAPID keys (single row)
CREATE TABLE public.vapid_keys (
  id integer PRIMARY KEY DEFAULT 1,
  public_key text NOT NULL,
  private_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.vapid_keys ENABLE ROW LEVEL SECURITY;

-- Public key is readable by anyone (needed by clients)
CREATE POLICY "Anyone can read vapid public key" ON public.vapid_keys
  FOR SELECT USING (true);

-- Only admins can manage VAPID keys
CREATE POLICY "Admins can manage vapid_keys" ON public.vapid_keys
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
