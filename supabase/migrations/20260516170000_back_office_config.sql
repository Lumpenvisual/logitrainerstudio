-- Back-office admin account (email + bootstrap metadata in Supabase)
CREATE TABLE public.back_office_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_email text NOT NULL,
  display_name text NOT NULL DEFAULT 'Back Office Admin',
  password_hash text NOT NULL,
  setup_token_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.back_office_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to back_office_config"
  ON public.back_office_config
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Default back-office: backoffice@logitrainerstudio.app / LTS-BackOffice-2026!mX
INSERT INTO public.back_office_config (admin_email, display_name, password_hash, setup_token_hash)
VALUES (
  'backoffice@logitrainerstudio.app',
  'Back Office Admin',
  extensions.crypt('LTS-BackOffice-2026!mX', extensions.gen_salt('bf')),
  extensions.crypt('LTS-Bootstrap-2026-xK9', extensions.gen_salt('bf'))
)
ON CONFLICT (id) DO UPDATE
SET admin_email = EXCLUDED.admin_email,
    display_name = EXCLUDED.display_name,
    password_hash = EXCLUDED.password_hash,
    setup_token_hash = EXCLUDED.setup_token_hash,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.is_back_office_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.back_office_config
    WHERE id = 1 AND lower(admin_email) = lower(_email)
  );
$$;

CREATE OR REPLACE FUNCTION public.grant_back_office_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_approvals (user_id, status, reviewed_at)
  VALUES (_user_id, 'approved', now())
  ON CONFLICT (user_id) DO UPDATE
  SET status = 'approved', reviewed_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_back_office_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_back_office_email(NEW.email) THEN
    PERFORM public.grant_back_office_admin(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_back_office ON auth.users;
CREATE TRIGGER on_auth_user_created_back_office
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_back_office_admin();

-- One-time bootstrap when migration runs after signup (existing auth user)
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE lower(email) = lower('backoffice@logitrainerstudio.app')
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    PERFORM public.grant_back_office_admin(admin_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_back_office(setup_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg record;
  admin_id uuid;
BEGIN
  IF setup_token IS NULL OR length(setup_token) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid setup token');
  END IF;

  SELECT * INTO cfg FROM public.back_office_config WHERE id = 1;
  IF cfg IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Back-office config missing');
  END IF;

  IF cfg.setup_token_hash <> extensions.crypt(setup_token, cfg.setup_token_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid setup token');
  END IF;

  SELECT id INTO admin_id
  FROM auth.users
  WHERE lower(email) = lower(cfg.admin_email)
  LIMIT 1;

  IF admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin user not found. Sign up first at /auth with email: ' || cfg.admin_email
    );
  END IF;

  PERFORM public.grant_back_office_admin(admin_id);
  RETURN jsonb_build_object('success', true, 'email', cfg.admin_email, 'user_id', admin_id);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_back_office(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_back_office(text) TO anon, authenticated, service_role;
