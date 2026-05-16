-- Harden auth signup triggers so back-office / user signup does not fail the transaction
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8)))
    ON CONFLICT (code) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_referral skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_back_office_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF public.is_back_office_email(NEW.email) THEN
      PERFORM public.grant_back_office_admin(NEW.id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_back_office_admin skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;
