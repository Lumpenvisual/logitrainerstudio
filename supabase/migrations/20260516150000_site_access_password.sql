-- Site-wide access password (bcrypt via pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.site_access_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  label text NOT NULL DEFAULT 'studio_gate',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_access_config ENABLE ROW LEVEL SECURITY;

-- No client access to the hash
CREATE POLICY "No direct access to site_access_config"
  ON public.site_access_config
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.verify_site_access(attempt text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  IF attempt IS NULL OR length(attempt) < 4 OR length(attempt) > 128 THEN
    RETURN false;
  END IF;

  SELECT password_hash INTO stored FROM public.site_access_config WHERE id = 1;
  IF stored IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored = extensions.crypt(attempt, stored);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_site_access(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_site_access(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_site_access(text) TO anon;

-- Default access password: LTS-Mayo2026-7kQ!
INSERT INTO public.site_access_config (password_hash, label)
VALUES (extensions.crypt('LTS-Mayo2026-7kQ!', extensions.gen_salt('bf')), 'studio_gate')
ON CONFLICT (id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    label = EXCLUDED.label,
    updated_at = now();
