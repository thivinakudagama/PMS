-- Project Management System schema for Supabase
-- Includes Perfex-style role-based access control.
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role_id uuid references public.roles(id) on delete set null,
  is_admin boolean not null default false,
  permissions_override jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role_id uuid references public.roles(id) on delete set null,
  permissions_override jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  start_date date,
  due_date date,
  budget numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'To Do'
    check (status in ('To Do', 'In Progress', 'Review', 'Completed')),
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  assignee text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  parent_channel_id uuid references public.channels(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type text not null default 'workspace' check (type in ('workspace', 'project')),
  channel_kind text not null default 'standard' check (channel_kind in ('home', 'subchannel', 'standard')),
  purpose text,
  is_private boolean not null default false,
  is_default boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.channel_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (channel_id, user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null default 'direct' check (type in ('direct', 'group')),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  parent_message_id uuid references public.messages(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  mentions text[] default '{}',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (channel_id is not null and conversation_id is null)
    or (channel_id is null and conversation_id is not null)
  )
);

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create table if not exists public.project_docs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null default 'Project overview',
  content_json jsonb not null default '{"text": ""}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, title)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.task_watchers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  unique (task_id, label)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  bucket_name text,
  storage_path text,
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'google_drive')),
  drive_file_id text,
  drive_folder_id text,
  drive_web_view_link text,
  drive_download_link text,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  scope text not null default 'workspace'
    check (scope in ('workspace', 'project', 'task', 'channel', 'message', 'doc')),
  created_at timestamptz not null default now()
);

create table if not exists public.file_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('mention', 'assignment', 'reply', 'due_soon', 'automation', 'project_update', 'task_update')),
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete cascade,
  entity_type text not null check (entity_type in ('project', 'task', 'message', 'doc', 'member', 'file')),
  event_type text not null,
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  action_type text not null,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  template_data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at before update on public.roles for each row execute function public.set_updated_at();

drop trigger if exists set_organization_members_updated_at on public.organization_members;
create trigger set_organization_members_updated_at before update on public.organization_members for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists set_channels_updated_at on public.channels;
create trigger set_channels_updated_at before update on public.channels for each row execute function public.set_updated_at();
drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();
drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at before update on public.messages for each row execute function public.set_updated_at();
drop trigger if exists set_project_docs_updated_at on public.project_docs;
create trigger set_project_docs_updated_at before update on public.project_docs for each row execute function public.set_updated_at();

alter table public.tasks
add column if not exists discussion_message_id uuid references public.messages(id) on delete set null;

create unique index if not exists project_members_project_id_user_id_key
on public.project_members(project_id, user_id)
where user_id is not null;

create or replace function public.default_manager_permissions()
returns jsonb
language sql
immutable
as $$
  select '{
    "dashboard": ["view_global"],
    "projects": ["view_global", "view_own", "create", "edit", "delete"],
    "tasks": ["view_global", "view_own", "create", "edit", "delete"],
    "team": ["view_global", "create", "edit"],
    "roles": ["view_global"],
    "reports": ["view_global"],
    "files": ["view_global", "create", "edit", "delete"],
    "settings": ["view_global"],
    "channels": ["view_global", "view_own", "create", "edit"],
    "messages": ["view_global", "view_own", "create", "edit", "delete"],
    "docs": ["view_global", "view_own", "create", "edit"],
    "automation": ["view_global", "create", "edit"],
    "search": ["view_global"],
    "notifications": ["view_global", "view_own"]
  }'::jsonb;
$$;

create or replace function public.default_member_permissions()
returns jsonb
language sql
immutable
as $$
  select '{
    "dashboard": ["view_own"],
    "projects": ["view_own"],
    "tasks": ["view_own", "create", "edit"],
    "team": ["view_own"],
    "roles": [],
    "reports": [],
    "files": ["view_own", "create"],
    "settings": ["view_own"],
    "channels": ["view_own"],
    "messages": ["view_own", "create"],
    "docs": ["view_own", "create", "edit"],
    "automation": [],
    "search": ["view_own"],
    "notifications": ["view_own"]
  }'::jsonb;
$$;

create or replace function public.admin_permissions()
returns jsonb
language sql
immutable
as $$
  select '{
    "dashboard": ["view_global", "view_own", "create", "edit", "delete"],
    "projects": ["view_global", "view_own", "create", "edit", "delete"],
    "tasks": ["view_global", "view_own", "create", "edit", "delete"],
    "team": ["view_global", "view_own", "create", "edit", "delete"],
    "roles": ["view_global", "view_own", "create", "edit", "delete"],
    "reports": ["view_global", "view_own", "create", "edit", "delete"],
    "files": ["view_global", "view_own", "create", "edit", "delete"],
    "settings": ["view_global", "view_own", "create", "edit", "delete"],
    "channels": ["view_global", "view_own", "create", "edit", "delete"],
    "messages": ["view_global", "view_own", "create", "edit", "delete"],
    "docs": ["view_global", "view_own", "create", "edit", "delete"],
    "automation": ["view_global", "view_own", "create", "edit", "delete"],
    "search": ["view_global", "view_own", "create", "edit", "delete"],
    "notifications": ["view_global", "view_own", "create", "edit", "delete"]
  }'::jsonb;
$$;

create or replace function public.has_org_membership(_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = _organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_permission(_organization_id uuid, _module text, _permission text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    left join public.roles r on r.id = om.role_id
    where om.organization_id = _organization_id
      and om.user_id = auth.uid()
      and (
        om.is_admin = true
        or (
          coalesce(om.permissions_override, r.permissions, '{}'::jsonb) -> _module
        ) ? _permission
      )
  );
$$;

create or replace function public.is_project_member(_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = _project_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.accept_pending_invitations()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
begin
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if current_email = '' then
    return;
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    email,
    role_id,
    is_admin,
    permissions_override
  )
  select
    si.organization_id,
    auth.uid(),
    current_email,
    si.role_id,
    false,
    si.permissions_override
  from public.staff_invitations si
  where lower(si.email) = current_email
    and si.accepted_at is null
    and not exists (
      select 1
      from public.organization_members om
      where om.organization_id = si.organization_id
        and om.user_id = auth.uid()
    );

  update public.staff_invitations
  set accepted_at = now()
  where lower(email) = current_email
    and accepted_at is null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_id uuid;
  admin_role_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name, email)
  values (new.id, display_name, new.email)
  on conflict (id) do nothing;

  insert into public.organizations (name, owner_id)
  values (display_name || '''s Workspace', new.id)
  returning id into organization_id;

  insert into public.roles (organization_id, name, description, permissions, is_system)
  values (organization_id, 'Administrator', 'Full workspace access. Admin users bypass permission checks.', public.admin_permissions(), true)
  returning id into admin_role_id;

  insert into public.roles (organization_id, name, description, permissions, is_system)
  values
    (organization_id, 'Project Manager', 'Can manage projects, tasks, staff, reports, and files.', public.default_manager_permissions(), true),
    (organization_id, 'Team Member', 'Can view assigned projects and work with own tasks.', public.default_member_permissions(), true);

  insert into public.organization_members (organization_id, user_id, email, role_id, is_admin)
  values (organization_id, new.id, new.email, admin_role_id, true)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.organization_members enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.project_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.project_docs enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_watchers enable row level security;
alter table public.task_labels enable row level security;
alter table public.files enable row level security;
alter table public.file_links enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;
alter table public.automations enable row level security;
alter table public.project_templates enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
  )
);

drop policy if exists "Profiles are editable by owner" on public.profiles;
create policy "Profiles are editable by owner"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Organizations are visible to members" on public.organizations;
create policy "Organizations are visible to members"
on public.organizations
for select
to authenticated
using (public.has_org_membership(id));

drop policy if exists "Organizations are editable by admins" on public.organizations;
create policy "Organizations are editable by admins"
on public.organizations
for update
to authenticated
using (public.has_org_permission(id, 'settings', 'edit'))
with check (public.has_org_permission(id, 'settings', 'edit'));

drop policy if exists "Roles are visible to members" on public.roles;
create policy "Roles are visible to members"
on public.roles
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Roles are insertable by role creators" on public.roles;
create policy "Roles are insertable by role creators"
on public.roles
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'roles', 'create'));

drop policy if exists "Roles are editable by role editors" on public.roles;
create policy "Roles are editable by role editors"
on public.roles
for update
to authenticated
using (public.has_org_permission(organization_id, 'roles', 'edit'))
with check (public.has_org_permission(organization_id, 'roles', 'edit'));

drop policy if exists "Roles are deletable by role deleters" on public.roles;
create policy "Roles are deletable by role deleters"
on public.roles
for delete
to authenticated
using (public.has_org_permission(organization_id, 'roles', 'delete') and is_system = false);

drop policy if exists "Organization members are visible to team viewers" on public.organization_members;
create policy "Organization members are visible to team viewers"
on public.organization_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_permission(organization_id, 'team', 'view_global')
  or public.has_org_permission(organization_id, 'team', 'view_own')
);

drop policy if exists "Organization members are insertable by team creators" on public.organization_members;
create policy "Organization members are insertable by team creators"
on public.organization_members
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'team', 'create'));

drop policy if exists "Organization members are editable by team editors" on public.organization_members;
create policy "Organization members are editable by team editors"
on public.organization_members
for update
to authenticated
using (public.has_org_permission(organization_id, 'team', 'edit'))
with check (public.has_org_permission(organization_id, 'team', 'edit'));

drop policy if exists "Organization members are deletable by team deleters" on public.organization_members;
create policy "Organization members are deletable by team deleters"
on public.organization_members
for delete
to authenticated
using (public.has_org_permission(organization_id, 'team', 'delete') and is_admin = false);

drop policy if exists "Staff invitations visible to team viewers" on public.staff_invitations;
create policy "Staff invitations visible to team viewers"
on public.staff_invitations
for select
to authenticated
using (public.has_org_permission(organization_id, 'team', 'view_global'));

drop policy if exists "Staff invitations insertable by team creators" on public.staff_invitations;
create policy "Staff invitations insertable by team creators"
on public.staff_invitations
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'team', 'create'));

drop policy if exists "Projects are readable by permitted members" on public.projects;
create policy "Projects are readable by permitted members"
on public.projects
for select
to authenticated
using (
  public.has_org_permission(organization_id, 'projects', 'view_global')
  or (
    public.has_org_permission(organization_id, 'projects', 'view_own')
    and (owner_id = auth.uid() or public.is_project_member(id))
  )
);

drop policy if exists "Projects are insertable by project creators" on public.projects;
create policy "Projects are insertable by project creators"
on public.projects
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.has_org_permission(organization_id, 'projects', 'create')
);

drop policy if exists "Projects are editable by project editors" on public.projects;
create policy "Projects are editable by project editors"
on public.projects
for update
to authenticated
using (public.has_org_permission(organization_id, 'projects', 'edit'))
with check (public.has_org_permission(organization_id, 'projects', 'edit'));

drop policy if exists "Projects are deletable by project deleters" on public.projects;
create policy "Projects are deletable by project deleters"
on public.projects
for delete
to authenticated
using (public.has_org_permission(organization_id, 'projects', 'delete'));

drop policy if exists "Tasks are readable by permitted members" on public.tasks;
create policy "Tasks are readable by permitted members"
on public.tasks
for select
to authenticated
using (
  public.has_org_permission(organization_id, 'tasks', 'view_global')
  or (
    public.has_org_permission(organization_id, 'tasks', 'view_own')
    and (
      owner_id = auth.uid()
      or assignee_user_id = auth.uid()
      or public.is_project_member(project_id)
    )
  )
);

drop policy if exists "Tasks are insertable by task creators" on public.tasks;
create policy "Tasks are insertable by task creators"
on public.tasks
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.has_org_permission(organization_id, 'tasks', 'create')
  and exists (
    select 1
    from public.projects
    where projects.id = tasks.project_id
      and projects.organization_id = tasks.organization_id
  )
);

drop policy if exists "Tasks are editable by task editors" on public.tasks;
create policy "Tasks are editable by task editors"
on public.tasks
for update
to authenticated
using (public.has_org_permission(organization_id, 'tasks', 'edit'))
with check (public.has_org_permission(organization_id, 'tasks', 'edit'));

drop policy if exists "Tasks are deletable by task deleters" on public.tasks;
create policy "Tasks are deletable by task deleters"
on public.tasks
for delete
to authenticated
using (public.has_org_permission(organization_id, 'tasks', 'delete'));

drop policy if exists "Project members are readable by permitted members" on public.project_members;
create policy "Project members are readable by permitted members"
on public.project_members
for select
to authenticated
using (
  public.has_org_permission(organization_id, 'team', 'view_global')
  or public.has_org_permission(organization_id, 'projects', 'view_global')
  or user_id = auth.uid()
  or public.is_project_member(project_id)
);

drop policy if exists "Project members are insertable by team creators" on public.project_members;
create policy "Project members are insertable by team creators"
on public.project_members
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.has_org_permission(organization_id, 'team', 'create')
);

drop policy if exists "Project members are editable by team editors" on public.project_members;
create policy "Project members are editable by team editors"
on public.project_members
for update
to authenticated
using (public.has_org_permission(organization_id, 'team', 'edit'))
with check (public.has_org_permission(organization_id, 'team', 'edit'));

drop policy if exists "Project members are deletable by team deleters" on public.project_members;
create policy "Project members are deletable by team deleters"
on public.project_members
for delete
to authenticated
using (public.has_org_permission(organization_id, 'team', 'delete'));

create index if not exists organizations_owner_id_idx on public.organizations(owner_id);
create index if not exists roles_organization_id_idx on public.roles(organization_id);
create index if not exists organization_members_organization_id_idx on public.organization_members(organization_id);
create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists staff_invitations_organization_id_idx on public.staff_invitations(organization_id);
create index if not exists staff_invitations_email_idx on public.staff_invitations(lower(email));
create index if not exists projects_organization_id_idx on public.projects(organization_id);
create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists tasks_organization_id_idx on public.tasks(organization_id);
create index if not exists tasks_owner_id_idx on public.tasks(owner_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists project_members_organization_id_idx on public.project_members(organization_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists channels_organization_id_idx on public.channels(organization_id);
create index if not exists channels_project_id_idx on public.channels(project_id);
create index if not exists channel_members_channel_id_idx on public.channel_members(channel_id);
create index if not exists channel_members_user_id_idx on public.channel_members(user_id);
create index if not exists conversations_organization_id_idx on public.conversations(organization_id);
create index if not exists conversation_members_conversation_id_idx on public.conversation_members(conversation_id);
create index if not exists conversation_members_user_id_idx on public.conversation_members(user_id);
create index if not exists messages_channel_id_idx on public.messages(channel_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_parent_message_id_idx on public.messages(parent_message_id);
create index if not exists project_docs_project_id_idx on public.project_docs(project_id);
create index if not exists task_comments_task_id_idx on public.task_comments(task_id);
create index if not exists files_organization_id_idx on public.files(organization_id);
create index if not exists files_project_id_idx on public.files(project_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists activity_events_organization_id_idx on public.activity_events(organization_id);
create index if not exists activity_events_project_id_idx on public.activity_events(project_id);

drop policy if exists "Channels visible to members" on public.channels;
create policy "Channels visible to members"
on public.channels
for select
to authenticated
using (
  public.has_org_membership(organization_id)
  and (
    is_private = false
    or exists (
      select 1
      from public.channel_members cm
      where cm.channel_id = channels.id
        and cm.user_id = auth.uid()
    )
  )
);

drop policy if exists "Channels insertable by channel creators" on public.channels;
create policy "Channels insertable by channel creators"
on public.channels
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_permission(organization_id, 'channels', 'create')
);

drop policy if exists "Channels editable by channel editors" on public.channels;
create policy "Channels editable by channel editors"
on public.channels
for update
to authenticated
using (public.has_org_permission(organization_id, 'channels', 'edit'))
with check (public.has_org_permission(organization_id, 'channels', 'edit'));

drop policy if exists "Channel members visible to org members" on public.channel_members;
create policy "Channel members visible to org members"
on public.channel_members
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Channel members insertable by channel creators" on public.channel_members;
create policy "Channel members insertable by channel creators"
on public.channel_members
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'channels', 'create'));

drop policy if exists "Channel members editable by self" on public.channel_members;
create policy "Channel members editable by self"
on public.channel_members
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Conversations visible to members" on public.conversations;
create policy "Conversations visible to members"
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "Conversations insertable by message creators" on public.conversations;
create policy "Conversations insertable by message creators"
on public.conversations
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_permission(organization_id, 'messages', 'create')
);

drop policy if exists "Conversation members visible to self" on public.conversation_members;
create policy "Conversation members visible to self"
on public.conversation_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "Conversation members insertable by conversation members" on public.conversation_members;
create policy "Conversation members insertable by conversation members"
on public.conversation_members
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'messages', 'create'));

drop policy if exists "Conversation members editable by self" on public.conversation_members;
create policy "Conversation members editable by self"
on public.conversation_members
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Messages visible to permitted members" on public.messages;
create policy "Messages visible to permitted members"
on public.messages
for select
to authenticated
using (
  public.has_org_membership(organization_id)
  and (
    channel_id is null
    or exists (
      select 1
      from public.channels c
      left join public.channel_members cm on cm.channel_id = c.id and cm.user_id = auth.uid()
      where c.id = messages.channel_id
        and (c.is_private = false or cm.id is not null)
    )
  )
  and (
    conversation_id is null
    or exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
    )
  )
);

drop policy if exists "Messages insertable by message creators" on public.messages;
create policy "Messages insertable by message creators"
on public.messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and public.has_org_permission(organization_id, 'messages', 'create')
);

drop policy if exists "Messages editable by author" on public.messages;
create policy "Messages editable by author"
on public.messages
for update
to authenticated
using (
  sender_user_id = auth.uid()
  and public.has_org_permission(organization_id, 'messages', 'edit')
)
with check (
  sender_user_id = auth.uid()
  and public.has_org_permission(organization_id, 'messages', 'edit')
);

drop policy if exists "Messages deletable by author or admin" on public.messages;
create policy "Messages deletable by author or admin"
on public.messages
for delete
to authenticated
using (
  (sender_user_id = auth.uid() and public.has_org_permission(organization_id, 'messages', 'delete'))
  or public.has_org_permission(organization_id, 'channels', 'delete')
);

drop policy if exists "Message reactions visible to permitted members" on public.message_reactions;
create policy "Message reactions visible to permitted members"
on public.message_reactions
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Message reactions insertable by self" on public.message_reactions;
create policy "Message reactions insertable by self"
on public.message_reactions
for insert
to authenticated
with check (user_id = auth.uid() and public.has_org_permission(organization_id, 'messages', 'create'));

drop policy if exists "Message reactions deletable by self" on public.message_reactions;
create policy "Message reactions deletable by self"
on public.message_reactions
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Project docs visible to project viewers" on public.project_docs;
create policy "Project docs visible to project viewers"
on public.project_docs
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Project docs insertable by doc creators" on public.project_docs;
create policy "Project docs insertable by doc creators"
on public.project_docs
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_permission(organization_id, 'docs', 'create')
);

drop policy if exists "Project docs editable by doc editors" on public.project_docs;
create policy "Project docs editable by doc editors"
on public.project_docs
for update
to authenticated
using (public.has_org_permission(organization_id, 'docs', 'edit'))
with check (public.has_org_permission(organization_id, 'docs', 'edit'));

drop policy if exists "Task comments visible to task viewers" on public.task_comments;
create policy "Task comments visible to task viewers"
on public.task_comments
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Task comments insertable by task creators" on public.task_comments;
create policy "Task comments insertable by task creators"
on public.task_comments
for insert
to authenticated
with check (user_id = auth.uid() and public.has_org_permission(organization_id, 'tasks', 'create'));

drop policy if exists "Task watchers visible to org members" on public.task_watchers;
create policy "Task watchers visible to org members"
on public.task_watchers
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Task watchers insertable by self" on public.task_watchers;
create policy "Task watchers insertable by self"
on public.task_watchers
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Task labels visible to org members" on public.task_labels;
create policy "Task labels visible to org members"
on public.task_labels
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Task labels insertable by task editors" on public.task_labels;
create policy "Task labels insertable by task editors"
on public.task_labels
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'tasks', 'edit'));

drop policy if exists "Files visible to org members" on public.files;
create policy "Files visible to org members"
on public.files
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Files insertable by file creators" on public.files;
create policy "Files insertable by file creators"
on public.files
for insert
to authenticated
with check (uploaded_by = auth.uid() and public.has_org_permission(organization_id, 'files', 'create'));

drop policy if exists "Files deletable by file deleters" on public.files;
create policy "Files deletable by file deleters"
on public.files
for delete
to authenticated
using (
  (uploaded_by = auth.uid() and public.has_org_permission(organization_id, 'files', 'delete'))
  or public.has_org_permission(organization_id, 'files', 'edit')
);

drop policy if exists "File links visible to org members" on public.file_links;
create policy "File links visible to org members"
on public.file_links
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "File links insertable by file creators" on public.file_links;
create policy "File links insertable by file creators"
on public.file_links
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'files', 'create'));

drop policy if exists "Notifications visible to owner" on public.notifications;
create policy "Notifications visible to owner"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Notifications insertable by org members" on public.notifications;
create policy "Notifications insertable by org members"
on public.notifications
for insert
to authenticated
with check (public.has_org_membership(organization_id));

drop policy if exists "Notifications editable by owner" on public.notifications;
create policy "Notifications editable by owner"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Activity events visible to org members" on public.activity_events;
create policy "Activity events visible to org members"
on public.activity_events
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Activity events insertable by org members" on public.activity_events;
create policy "Activity events insertable by org members"
on public.activity_events
for insert
to authenticated
with check (public.has_org_membership(organization_id));

drop policy if exists "Automations visible to org members" on public.automations;
create policy "Automations visible to org members"
on public.automations
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Automations insertable by automation creators" on public.automations;
create policy "Automations insertable by automation creators"
on public.automations
for insert
to authenticated
with check (created_by = auth.uid() and public.has_org_permission(organization_id, 'automation', 'create'));

drop policy if exists "Automations editable by automation editors" on public.automations;
create policy "Automations editable by automation editors"
on public.automations
for update
to authenticated
using (public.has_org_permission(organization_id, 'automation', 'edit'))
with check (public.has_org_permission(organization_id, 'automation', 'edit'));

drop policy if exists "Project templates visible to org members" on public.project_templates;
create policy "Project templates visible to org members"
on public.project_templates
for select
to authenticated
using (public.has_org_membership(organization_id));

drop policy if exists "Project templates insertable by project creators" on public.project_templates;
create policy "Project templates insertable by project creators"
on public.project_templates
for insert
to authenticated
with check (public.has_org_permission(organization_id, 'projects', 'create'));
