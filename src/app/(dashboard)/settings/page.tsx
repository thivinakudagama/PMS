import { createClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/current-org";
import { getEffectivePermissions, MODULES, MODULE_LABELS, ACTION_LABELS, resolveRole } from "@/lib/rbac";
import { changeOwnPassword } from "@/app/(auth)/auth-actions";
import type { ActivityEvent } from "@/lib/types";
import Link from "next/link";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const { membership, organizationId, organizationName } = await requireModuleAccess("settings");
  const permissions = getEffectivePermissions(membership);
  const role = membership.is_admin ? "Administrator" : resolveRole(membership)?.name ?? "Staff";
  const { data: events } = await supabase
    .from("activity_events")
    .select("*")
    .eq("organization_id", organizationId)
    .in("entity_type", ["member"])
    .order("created_at", { ascending: false })
    .limit(8);
  const activityEvents = (events ?? []) as ActivityEvent[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Settings</h1>
          <p className="muted">Manage your account, security, permissions, and project administration links.</p>
        </div>
      </section>

      {params.error ? <div className="alert error">{params.error}</div> : null}
      {params.message ? <div className="alert success">{params.message}</div> : null}

      <section className="card settings-card">
        <h2>Profile</h2>
        <div className="settings-grid">
          <span>
            <strong>Name</strong>
            {profile?.full_name || "Not set"}
          </span>
          <span>
            <strong>Email</strong>
            {user?.email || "Not set"}
          </span>
          <span>
            <strong>Portfolio</strong>
            {organizationName}
          </span>
          <span>
            <strong>Role</strong>
            {role}
          </span>
        </div>
      </section>

      <section className="card">
        <h2>Effective permissions</h2>
        <div className="role-permission-list">
          {MODULES.map((moduleName) => (
            <div className="role-permission-row" key={moduleName}>
              <strong>{MODULE_LABELS[moduleName]}</strong>
              <span>
                {membership.is_admin
                  ? "Administrator access"
                  : permissions[moduleName]?.length
                    ? permissions[moduleName]?.map((value) => ACTION_LABELS[value]).join(", ")
                    : "No access"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="split-layout">
        <section className="card form-card">
          <div>
            <h2>Change password</h2>
            <p className="muted">Update your password without waiting for an administrator.</p>
          </div>

          <form action={changeOwnPassword} className="form-stack">
            <label>
              New password
              <input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required />
            </label>

            <label>
              Confirm password
              <input
                name="confirm_password"
                type="password"
                minLength={8}
                placeholder="Re-enter your new password"
                required
              />
            </label>

            <button className="button primary" type="submit">
              Save password
            </button>
          </form>
        </section>

        <section className="card form-card">
          <div>
            <h2>Administration links</h2>
            <p className="muted">Jump straight into the areas used to manage users, roles, and projects.</p>
          </div>
          <div className="list-stack">
            <Link href="/team" className="list-row">
              <div>
                <strong>Users</strong>
                <p className="muted">Create accounts, change roles, and reset passwords.</p>
              </div>
            </Link>
            <Link href="/roles" className="list-row">
              <div>
                <strong>Roles</strong>
                <p className="muted">Define access rules for projects, tasks, files, and messaging.</p>
              </div>
            </Link>
            <Link href="/projects" className="list-row">
              <div>
                <strong>Projects</strong>
                <p className="muted">Manage project records and assign users to project delivery teams.</p>
              </div>
            </Link>
          </div>
        </section>
      </section>

      <section className="card">
        <h2>Access audit trail</h2>
        <div className="timeline-list">
          {activityEvents.map((event) => (
            <article className="timeline-item" key={event.id}>
              <span className="timeline-dot" />
              <div>
                <strong>{event.title}</strong>
                <p className="muted">{event.detail || event.event_type}</p>
                <small>{new Date(event.created_at).toLocaleString()}</small>
              </div>
            </article>
          ))}

          {!activityEvents.length ? <p className="muted">Role and access changes will appear here.</p> : null}
        </div>
      </section>
    </div>
  );
}
