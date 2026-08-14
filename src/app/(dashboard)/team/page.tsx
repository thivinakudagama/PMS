import { requireModuleAccess } from "@/lib/current-org";
import { TeamManagementDashboard } from "@/components/team-management-dashboard";

type StaffMember = {
  id: string;
  email: string | null;
  is_admin: boolean;
  user_id: string;
  role_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
  roles?: {
    id: string;
    name: string;
  } | null;
};

type Role = {
  id: string;
  name: string;
};

type TeamPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const params = await searchParams;
  const { supabase, membership, organizationId } = await requireModuleAccess("team");

  const [{ data: members }, { data: roles }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, email, is_admin, user_id, role_id, created_at, profiles(full_name), roles(id, name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase.from("roles").select("id, name").eq("organization_id", organizationId).order("name")
  ]);

  const memberList = (members ?? []) as unknown as StaffMember[];
  const roleList = (roles ?? []) as Role[];

  return (
    <div className="page-stack">
      <section className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <p className="eyebrow">Administration</p>
          <h1>User Management</h1>
          <p className="muted">Create user accounts, assign roles, and control who can work on projects and delivery flows.</p>
        </div>
      </section>

      {params.error ? <div className="alert error">{params.error}</div> : null}
      {params.message ? <div className="alert success">{params.message}</div> : null}

      {/* Main Interactive Dashboard */}
      <TeamManagementDashboard
        members={memberList}
        roles={roleList}
        membership={membership}
      />

      {/* Management Workflow Information footer */}
      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.85rem" }}>User Management Lifecycle</h2>
        <div className="list-stack" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div className="list-row" style={{ flexDirection: "column", gap: "0.4rem", margin: 0, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>1. Internal Accounts</strong>
              <span className="badge in-progress">User Setup</span>
            </div>
            <p className="muted" style={{ fontSize: "13px", margin: 0 }}>
              Create employees, contractors, and support users via the &quot;Create User&quot; modal. They can access the portal immediately.
            </p>
          </div>
          <div className="list-row" style={{ flexDirection: "column", gap: "0.4rem", margin: 0, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>2. Access Control</strong>
              <span className="badge priority-medium">Roles</span>
            </div>
            <p className="muted" style={{ fontSize: "13px", margin: 0 }}>
              Use the Roles module to define fine-grained permission sets, then apply them to user profiles during creation or edit.
            </p>
          </div>
          <div className="list-row" style={{ flexDirection: "column", gap: "0.4rem", margin: 0, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>3. Project Membership</strong>
              <span className="badge completed">Assignment</span>
            </div>
            <p className="muted" style={{ fontSize: "13px", margin: 0 }}>
              Once created, assign users to specific project spaces so they can view boards, watch tasks, and collaborate in channels.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

