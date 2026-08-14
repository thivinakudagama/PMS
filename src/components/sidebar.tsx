import { getCurrentOrg } from "@/lib/current-org";
import { resolveRole } from "@/lib/rbac";
import { signOut } from "@/app/(auth)/auth-actions";
import { SidebarClient, type SidebarNavIcon } from "@/components/sidebar-client";
import { cookies } from "next/headers";

const workspaceItems = [
  { href: "/dashboard", label: "Dashboard", icon: "layoutDashboard" },
  { href: "/projects", label: "Projects", icon: "folderKanban" },
  { href: "/tasks", label: "Tasks", icon: "checkSquare" },
  { href: "/team", label: "Users", icon: "users" },
  { href: "/roles", label: "Roles", icon: "shieldCheck" },
  { href: "/reports", label: "Reports", icon: "barChart3" },
  { href: "/calendar", label: "Calendar", icon: "calendarDays" },
  { href: "/files", label: "Files", icon: "files" },
  { href: "/settings", label: "Settings", icon: "settings" }
] satisfies Array<{ href: string; label: string; icon: SidebarNavIcon }>;

const collaborationItems = [
  { href: "/inbox", label: "Inbox", icon: "bellRing" },
  { href: "/channels", label: "Channels", icon: "hash" },
  { href: "/direct-messages", label: "Direct Messages", icon: "messageSquare" },
  { href: "/activity", label: "Activity", icon: "activity" }
] satisfies Array<{ href: string; label: string; icon: SidebarNavIcon }>;

export async function Sidebar() {
  const cookieStore = await cookies();
  const savedSidebarState = cookieStore.get("pms:sidebar-collapsed")?.value;
  const { supabase, organizationId, membership, user } = await getCurrentOrg();
  const roleName = membership.is_admin ? "Administrator" : resolveRole(membership)?.name ?? "Staff";

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("is_read", false)
  ]);

  const collaboration = collaborationItems.map((item) => ({
    ...item,
    badge: item.href === "/inbox" ? unreadCount ?? 0 : null
  }));

  const workspace = workspaceItems.map((item) => ({
    ...item,
    badge: null
  }));

  return (
    <SidebarClient
      collaborationItems={collaboration}
      workspaceItems={workspace}
      roleName={roleName}
      fullName={profile?.full_name ?? "Project Manager"}
      initialCollapsed={savedSidebarState === undefined ? true : savedSidebarState === "true"}
      signOutAction={signOut}
    />
  );
}
