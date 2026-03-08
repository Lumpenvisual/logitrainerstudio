-- FIX: Convert ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- alert_settings
DROP POLICY IF EXISTS "Users can insert own settings" ON public.alert_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.alert_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.alert_settings;
CREATE POLICY "Users can insert own settings" ON public.alert_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.alert_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own settings" ON public.alert_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- projects
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- smart_alerts
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.smart_alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.smart_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.smart_alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.smart_alerts;
CREATE POLICY "Users can delete own alerts" ON public.smart_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.smart_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.smart_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own alerts" ON public.smart_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_api_keys
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can view own API keys" ON public.user_api_keys;
CREATE POLICY "Users can delete own API keys" ON public.user_api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON public.user_api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON public.user_api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own API keys" ON public.user_api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_approvals
DROP POLICY IF EXISTS "Admins can manage approvals" ON public.user_approvals;
DROP POLICY IF EXISTS "Users can view own approval" ON public.user_approvals;
CREATE POLICY "Admins can manage approvals" ON public.user_approvals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own approval" ON public.user_approvals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);