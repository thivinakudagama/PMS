import { createRole, deleteRole, updateRole } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";
import { ACTIONS, ACTION_LABELS, MODULES, MODULE_LABELS, can, type PermissionSet } from "@/lib/rbac";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionSet;
  is_system: boolean;
};

type RolesPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const params = await searchParams;
  const { supabase, membership, organizationId } = await requireModuleAccess("roles");

  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  const roleList = (roles ?? []) as Role[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Access control</p>
          <h1>Roles & Permissions</h1>
          <p className="muted">
            Perfex-style module permissions: View Global, View Own, Create, Edit, and Delete.
          </p>
        </div>
      </section>

      {params.error ? <div className="alert error">{params.error}</div> : null}
      {params.message ? <div className="alert success">{params.message}</div> : null}

      <section className="split-layout">
        {can(membership, "roles", "create") ? (
          <form action={createRole} className="card form-card">
            <div>
              <h2>Create role</h2>
              <p className="muted">Create a reusable staff permission template.</p>
            </div>

            <label>
              Role name
              <input name="name" placeholder="Project Manager" required />
            </label>

            <label>
              Description
              <textarea name="description" rows={3} placeholder="What this role can do..." />
            </label>

            <div className="permission-matrix">
              {MODULES.map((moduleName) => (
                <div className="permission-module" key={moduleName}>
                  <strong>{MODULE_LABELS[moduleName]}</strong>
                  <div className="permission-actions">
                    {ACTIONS.map((action) => (
                      <label className="checkbox-label" key={action}>
                        <input type="checkbox" name={`perm_${moduleName}`} value={action} />
                        {ACTION_LABELS[action]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="button primary" type="submit">
              Create role
            </button>
          </form>
        ) : (
          <div className="card empty-state">
            <h2>View-only access</h2>
            <p className="muted">Your role does not allow creating roles.</p>
          </div>
        )}

        <div className="page-stack">
          {roleList.map((role) => (
            <article className="card" key={role.id}>
              <div className="card-header">
                <div>
                  <h2>{role.name}</h2>
                  <p className="muted">{role.description || "No description."}</p>
                </div>

                {can(membership, "roles", "delete") && !role.is_system ? (
                  <form action={deleteRole}>
                    <input type="hidden" name="role_id" value={role.id} />
                    <button className="button danger small" type="submit">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>

              {!role.is_system && can(membership, "roles", "edit") ? (
                <form action={updateRole} className="form-stack">
                  <input type="hidden" name="role_id" value={role.id} />
                  <label>
                    Role name
                    <input name="name" defaultValue={role.name} required />
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows={3} defaultValue={role.description ?? ""} />
                  </label>
                  <div className="permission-matrix">
                    {MODULES.map((moduleName) => (
                      <div className="permission-module" key={moduleName}>
                        <strong>{MODULE_LABELS[moduleName]}</strong>
                        <div className="permission-actions">
                          {ACTIONS.map((action) => (
                            <label className="checkbox-label" key={action}>
                              <input
                                type="checkbox"
                                name={`perm_${moduleName}`}
                                value={action}
                                defaultChecked={(role.permissions?.[moduleName] ?? []).includes(action)}
                              />
                              {ACTION_LABELS[action]}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="button primary" type="submit">
                    Save role
                  </button>
                </form>
              ) : (
                <div className="role-permission-list">
                  {MODULES.map((moduleName) => {
                    const values = role.permissions?.[moduleName] ?? [];

                    return (
                      <div className="role-permission-row" key={moduleName}>
                        <strong>{MODULE_LABELS[moduleName]}</strong>
                        <span>
                          {values.length
                            ? values.map((value) => ACTION_LABELS[value]).join(", ")
                            : "No access"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}

          {!roleList.length ? (
            <div className="card empty-state">
              <h2>No roles yet</h2>
              <p className="muted">Create your first staff role.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
