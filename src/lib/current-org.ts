import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { can, canView, type ModuleName, type PermissionAction } from "@/lib/rbac";

export async function getCurrentOrg() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("active-org-id")?.value ?? null;

  // Only run the invite acceptance RPC once per browser session, not on every page render.
  // The cookie has no max-age so it clears when the browser session ends (next login re-checks).
  const invitesChecked = cookieStore.get("pms:invites-accepted")?.value;
  if (!invitesChecked) {
    await supabase.rpc("accept_pending_invitations");
    try {
      cookieStore.set("pms:invites-accepted", "1", { path: "/", httpOnly: true, sameSite: "lax" });
    } catch {
      // Server Components cannot always write cookies — middleware will handle it.
    }
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      user_id,
      is_admin,
      permissions_override,
      roles (
        id,
        name,
        permissions
      ),
      organizations (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    throw new Error("No workspace membership found for this account.");
  }

  const membership =
    memberships.find((item: { organization_id: string }) => item.organization_id === activeOrganizationId) ??
    memberships[0];

  const organization = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  return {
    supabase,
    user,
    membership,
    memberships,
    organizationId: membership.organization_id as string,
    organizationName: organization?.name ?? "Workspace"
  };
}

export async function requirePermission(moduleName: ModuleName, action: PermissionAction) {
  const context = await getCurrentOrg();

  if (!can(context.membership, moduleName, action)) {
    throw new Error(`You do not have permission to ${action.replace("_", " ")} ${moduleName}.`);
  }

  return context;
}

export async function requireModuleAccess(moduleName: ModuleName) {
  const context = await getCurrentOrg();

  if (!canView(context.membership, moduleName)) {
    redirect("/dashboard");
  }

  return context;
}
