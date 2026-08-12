-- 20260812000000_platform_admins.sql
-- Adds Platform Admin (Super Admin) capabilities

-- 1. Create the platform_admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS on platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone can read platform_admins (needed for policies to work efficiently)
CREATE POLICY "Platform admins are viewable by everyone" ON public.platform_admins
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies, meaning only service_role (or superuser) can modify it.

-- 4. Helper function to check if a user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add RLS Policies for Platform Admins to all major tables

-- Profiles
CREATE POLICY "Platform admins manage all profiles" ON public.profiles FOR ALL USING (public.is_platform_admin());

-- Organizations
CREATE POLICY "Platform admins manage all orgs" ON public.organizations FOR ALL USING (public.is_platform_admin());

-- Organization Members
CREATE POLICY "Platform admins manage all org members" ON public.organization_members FOR ALL USING (public.is_platform_admin());

-- Projects
CREATE POLICY "Platform admins manage all projects" ON public.projects FOR ALL USING (public.is_platform_admin());

-- Tasks
CREATE POLICY "Platform admins manage all tasks" ON public.tasks FOR ALL USING (public.is_platform_admin());

-- Files
CREATE POLICY "Platform admins manage all files" ON public.files FOR ALL USING (public.is_platform_admin());

-- Channels
CREATE POLICY "Platform admins manage all channels" ON public.channels FOR ALL USING (public.is_platform_admin());

-- Channel Messages
CREATE POLICY "Platform admins manage all channel messages" ON public.channel_messages FOR ALL USING (public.is_platform_admin());

-- Direct Messages
CREATE POLICY "Platform admins manage all direct messages" ON public.direct_messages FOR ALL USING (public.is_platform_admin());

-- Activity Logs
CREATE POLICY "Platform admins manage all activity logs" ON public.activity_logs FOR ALL USING (public.is_platform_admin());

-- Notifications
CREATE POLICY "Platform admins manage all notifications" ON public.notifications FOR ALL USING (public.is_platform_admin());
