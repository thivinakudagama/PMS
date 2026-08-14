export const MODULES = [
  "dashboard",
  "projects",
  "tasks",
  "team",
  "roles",
  "reports",
  "files",
  "settings",
  "channels",
  "messages",
  "docs",
  "automation",
  "search",
  "notifications"
] as const;

export const MODULE_LABELS: Record<(typeof MODULES)[number], string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  team: "Team / Staff",
  roles: "Roles & Permissions",
  reports: "Reports",
  files: "Files",
  settings: "Settings",
  channels: "Channels",
  messages: "Messages",
  docs: "Docs",
  automation: "Automation",
  search: "Search",
  notifications: "Notifications"
};

export const ACTIONS = ["view_global", "view_own", "create", "edit", "delete"] as const;

export const ACTION_LABELS: Record<(typeof ACTIONS)[number], string> = {
  view_global: "View Global",
  view_own: "View Own",
  create: "Create",
  edit: "Edit",
  delete: "Delete"
};

export type ModuleName = (typeof MODULES)[number];
export type PermissionAction = (typeof ACTIONS)[number];
export type PermissionSet = Partial<Record<ModuleName, PermissionAction[]>>;

export type RoleLike = {
  name?: string | null;
  permissions?: PermissionSet | null;
};

export type MembershipLike = {
  is_admin?: boolean | null;
  permissions_override?: PermissionSet | null;
  roles?: RoleLike | RoleLike[] | null;
};

export function resolveRole(membership: MembershipLike | null | undefined): RoleLike | null {
  if (!membership?.roles) return null;
  return Array.isArray(membership.roles) ? membership.roles[0] ?? null : membership.roles;
}

export function getEffectivePermissions(membership: MembershipLike | null | undefined): PermissionSet {
  if (!membership) return {};
  if (membership.permissions_override) return membership.permissions_override;
  return resolveRole(membership)?.permissions ?? {};
}

export function can(
  membership: MembershipLike | null | undefined,
  moduleName: ModuleName,
  action: PermissionAction
) {
  if (membership?.is_admin) return true;

  const permissions = getEffectivePermissions(membership);
  const actions = permissions[moduleName] ?? [];

  return actions.includes(action);
}

export function canView(membership: MembershipLike | null | undefined, moduleName: ModuleName) {
  return can(membership, moduleName, "view_global") || can(membership, moduleName, "view_own");
}
