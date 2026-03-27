
-- Marketing content generations tracking
CREATE TABLE public.marketing_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  framework text,
  platform text,
  prompt text NOT NULL,
  result jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" ON public.marketing_generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON public.marketing_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own generations" ON public.marketing_generations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Scheduled social media posts
CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  content text NOT NULL,
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  generation_id uuid REFERENCES public.marketing_generations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own posts" ON public.scheduled_posts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
