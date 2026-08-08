-- 20260808000000_init_schema.sql
-- Complete Supabase Postgres DDL with Multi-Tenant RLS & Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE org_role AS ENUM ('Admin', 'Project Manager', 'Member', 'Viewer');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations Table (Multi-tenant core)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  google_drive_folder_id TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members Table (RBAC)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'Member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

-- Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  priority project_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Files Table (Google Drive references)
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  google_drive_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  web_view_link TEXT,
  thumbnail_link TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channels Table (Group Chat)
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channel Messages Table
CREATE TABLE public.channel_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Direct Messages Table (1-on-1 Chat)
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper Security Functions for RLS
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = target_org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_org_role(target_org_id UUID)
RETURNS org_role AS $$
DECLARE
  user_role org_role;
BEGIN
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE org_id = target_org_id AND user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Viewable by anyone authenticated, editable by self
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: Viewable if member
CREATE POLICY "Org members can view organization" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Org admins can update organization" ON public.organizations FOR UPDATE USING (public.get_user_org_role(id) = 'Admin');

-- Organization Members: Viewable if in same org
CREATE POLICY "Members view org roster" ON public.organization_members FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Admins manage members" ON public.organization_members FOR ALL USING (public.get_user_org_role(org_id) = 'Admin');

-- Projects: Members can view; Admins & PMs can insert/update/delete
CREATE POLICY "Members view projects" ON public.projects FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Admins/PMs manage projects" ON public.projects FOR ALL USING (public.get_user_org_role(org_id) IN ('Admin', 'Project Manager'));

-- Tasks: Viewable by org members; Members/PMs/Admins can edit (Viewers read-only)
CREATE POLICY "Members view tasks" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND public.is_org_member(projects.org_id))
);
CREATE POLICY "Non-viewers manage tasks" ON public.tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = tasks.project_id 
    AND public.get_user_org_role(projects.org_id) IN ('Admin', 'Project Manager', 'Member')
  )
);

-- Files: Viewable and manageable by org members
CREATE POLICY "Members view files" ON public.files FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Members insert files" ON public.files FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- Channels & Messages
CREATE POLICY "Members view channels" ON public.channels FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Members view channel messages" ON public.channel_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channels WHERE channels.id = channel_messages.channel_id AND public.is_org_member(channels.org_id))
);
CREATE POLICY "Members post channel messages" ON public.channel_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.channels WHERE channels.id = channel_messages.channel_id AND public.is_org_member(channels.org_id))
);

-- Direct Messages
CREATE POLICY "Users view own DMs" ON public.direct_messages FOR SELECT USING (
  public.is_org_member(org_id) AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);
CREATE POLICY "Users send DMs" ON public.direct_messages FOR INSERT WITH CHECK (
  public.is_org_member(org_id) AND auth.uid() = sender_id
);

-- Activity Logs & Notifications
CREATE POLICY "Members view activity logs" ON public.activity_logs FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
