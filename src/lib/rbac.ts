import { OrgRole } from '@/types/database.types';

export type PermissionAction =
  | 'org:update'
  | 'org:delete'
  | 'member:invite'
  | 'member:remove'
  | 'member:role_change'
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:assign'
  | 'channel:create'
  | 'channel:post'
  | 'file:upload'
  | 'file:delete'
  | 'report:view';

const ROLE_PERMISSIONS: Record<OrgRole, PermissionAction[]> = {
  Admin: [
    'org:update',
    'org:delete',
    'member:invite',
    'member:remove',
    'member:role_change',
    'project:create',
    'project:edit',
    'project:delete',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'channel:create',
    'channel:post',
    'file:upload',
    'file:delete',
    'report:view',
  ],
  'Project Manager': [
    'member:invite',
    'project:create',
    'project:edit',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'channel:create',
    'channel:post',
    'file:upload',
    'file:delete',
    'report:view',
  ],
  Member: [
    'task:create',
    'task:edit',
    'task:assign',
    'channel:post',
    'file:upload',
    'report:view',
  ],
  Viewer: [
    'report:view',
  ],
};

export function hasPermission(role: OrgRole | null | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}

export function canManageProject(role: OrgRole | null | undefined): boolean {
  return role === 'Admin' || role === 'Project Manager';
}

export function canManageTasks(role: OrgRole | null | undefined): boolean {
  return role === 'Admin' || role === 'Project Manager' || role === 'Member';
}

export function isOrgAdmin(role: OrgRole | null | undefined): boolean {
  return role === 'Admin';
}
