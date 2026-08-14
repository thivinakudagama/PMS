# Project Management System - Next.js + Supabase

A full-stack starter project for a project management system using:

- Next.js App Router
- React Server Components
- Server Actions
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Perfex-style role-based access control
- Plain CSS, no UI framework required

## Features

- Admin-created staff accounts with email/password login
- Protected dashboard layout
- Workspace/organization support
- Perfex-style roles and permissions
- Admin users with full access
- Admin-managed staff profile creation
- Project CRUD
- Task creation, delete, and status updates
- Kanban-style project detail page
- Team member assignment per project
- Dashboard metrics
- Reports page
- Settings/profile page
- Supabase SQL schema with RLS policies


## Design theme

The UI uses the Professional Enterprise Identity theme from `docs/DESIGN.md`.

Applied design choices:

- Deep navy sidebar, hero surfaces, and primary buttons
- Amber highlights for activity, focus, and in-progress states
- Manrope typography
- Rounded cards, buttons, inputs, and pill badges
- 8px-based spacing system
- Neutral enterprise surfaces for dashboards, lists, and Kanban boards

The main styling file is:

```text
src/app/globals.css
```

## RBAC model

The app uses a Perfex-inspired access-control model:

- **Administrator** users bypass permission checks and can access everything.
- **Roles** define module-level permissions.
- **Staff members** receive a role.
- **Staff permission overrides** are supported in the database with `permissions_override`.
- Permissions use this pattern:

```text
View Global - can view all records in the workspace
View Own    - can view assigned/owned records only
Create      - can create records
Edit        - can update records
Delete      - can delete records
```

Current modules:

```text
dashboard
projects
tasks
team
roles
reports
files
settings
```

## 1. Create a Supabase project

Create a new Supabase project, then open:

Project Settings -> API

Copy:

- Project URL
- Publishable key

## 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## 3. Create the database

Open Supabase SQL Editor and run:

```sql
-- Paste everything from supabase/schema.sql
```

The schema creates:

- profiles
- organizations
- roles
- organization_members
- staff_invitations
- projects
- tasks
- project_members
- RLS policies
- helper functions for permission checks

## 4. Install dependencies

```bash
npm install
```

## 5. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 6. Suggested Supabase Auth settings

For local development, you can disable email confirmation in:

Authentication -> Sign In / Providers -> Email

For production, keep email confirmation enabled and configure your Site URL and Redirect URLs.

## 7. How staff account creation works

1. Admin creates or selects a role in **Roles**.
2. Admin creates the staff profile from **Team** with name, company email, and temporary password.
3. The app creates the auth user and adds them to the current workspace.
4. Staff signs in with the credentials shared by the admin.
5. Admin can update the staff member role later from the same **Team** page.

## Project structure

```text
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      projects/
      tasks/
      team/
      roles/
      reports/
      settings/
    layout.tsx
    page.tsx
  components/
  lib/
    current-org.ts
    rbac.ts
    supabase/
supabase/
  schema.sql
```

## Notes

This project is a strong starter, not a finished SaaS. Before production, add password reset and account recovery flows, audit logs, form validation, rate limits, workspace switching, and more detailed staff-level permission override UI.
