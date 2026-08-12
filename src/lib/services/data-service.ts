import { createClient } from '@/lib/supabase/client';
import {
  Organization,
  Project,
  Task,
  OrganizationMember,
  UserProfile,
  FileItem,
  Channel,
  Message,
  ActivityLog,
  NotificationItem,
} from '@/types';

export const dataService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) return data as UserProfile;
    return null;
  },

  async checkIsSuperAdmin(userId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase.from('platform_admins').select('user_id').eq('user_id', userId).single();
    if (error || !data) return false;
    return true;
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) return data as UserProfile[];
    return [];
  },

  async getPlatformStats(): Promise<{ totalUsers: number; totalOrgs: number; totalProjects: number }> {
    const supabase = createClient();
    const [usersRes, orgsRes, projectsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersRes.count || 0,
      totalOrgs: orgsRes.count || 0,
      totalProjects: projectsRes.count || 0,
    };
  },

  async getOrganizations(): Promise<Organization[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('organizations').select('*');
    if (!error && data) return data as Organization[];
    return [];
  },

  async createOrganization(name: string, slug: string): Promise<Organization | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('organizations') as any)
      .insert({ name, slug })
      .select()
      .single();
    if (!error && data) return data as Organization;
    return null;
  },

  async getProjects(orgId: string): Promise<Project[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').select('*').eq('org_id', orgId);
    if (!error && data) return data as Project[];
    return [];
  },

  async createProject(project: Partial<Project> & { title: string; org_id: string }): Promise<Project | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('projects') as any)
      .insert({
        org_id: project.org_id,
        title: project.title,
        description: project.description,
        status: project.status || 'active',
        priority: project.priority || 'medium',
        due_date: project.due_date,
      })
      .select()
      .single();
    if (!error && data) return data as Project;
    return null;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('projects') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as Project;
    return null;
  },

  async deleteProject(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return !error;
  },

  async getTasks(orgId: string): Promise<Task[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('tasks').select('*');
    if (!error && data) return data as Task[];
    return [];
  },

  async createTask(task: Partial<Task> & { title: string; project_id: string }): Promise<Task | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('tasks') as any)
      .insert({
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date,
      })
      .select()
      .single();
    if (!error && data) return data as Task;
    return null;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('tasks') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as Task;
    return null;
  },

  async deleteTask(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return !error;
  },

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('organization_members')
      .select('*, user:profiles(*)')
      .eq('org_id', orgId);
    if (!error && data) return data as OrganizationMember[];
    return [];
  },

  async addMember(orgId: string, email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer', userId?: string): Promise<OrganizationMember | null> {
    const supabase = createClient();
    if (userId) {
      const { data, error } = await (supabase.from('organization_members') as any)
        .insert({ org_id: orgId, user_id: userId, role })
        .select('*, user:profiles(*)')
        .single();
      if (!error && data) return data as OrganizationMember;
    }
    return null;
  },

  async inviteMember(orgId: string, email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer'): Promise<OrganizationMember | null> {
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, email, role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }
      
      return data.member as OrganizationMember;
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  },

  async updateMemberRole(memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer'): Promise<OrganizationMember | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('organization_members') as any)
      .update({ role })
      .eq('id', memberId)
      .select('*, user:profiles(*)')
      .single();
    if (!error && data) return data as OrganizationMember;
    return null;
  },

  async removeMember(memberId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('organization_members').delete().eq('id', memberId);
    return !error;
  },

  async getFiles(orgId: string): Promise<FileItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('files').select('*').eq('org_id', orgId);
    if (!error && data) return data as FileItem[];
    return [];
  },

  async addFile(file: Partial<FileItem> & { name?: string; org_id?: string }): Promise<FileItem | null> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('files') as any)
      .insert({
        org_id: file.org_id,
        file_name: file.name || file.file_name,
        mime_type: file.mime_type,
        google_drive_id: file.google_drive_id || 'test',
      })
      .select()
      .single();
    if (!error && data) return data as FileItem;
    return null;
  },

  async getActivities(orgId: string): Promise<ActivityLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('activity_logs')
      .select('*, user:profiles(*)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as ActivityLog[];
    return [];
  },

  async logActivity(orgId: string, action: string, entityType: string, entityId?: string, metadata?: any): Promise<ActivityLog | null> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await (supabase.from('activity_logs') as any)
      .insert({
        org_id: orgId,
        user_id: userData.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      })
      .select('*, user:profiles(*)')
      .single();
    if (!error && data) return data as ActivityLog;
    return null;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', userData.user.id);
    if (!error && data) return data as NotificationItem[];
    return [];
  },

  async markNotificationRead(id: string): Promise<void> {
    const supabase = createClient();
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id);
  },

  async getChannels(orgId: string): Promise<Channel[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('channels').select('*').eq('org_id', orgId);
    if (!error && data) return data as Channel[];
    return [];
  },

  async getMessages(channelId: string): Promise<Message[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('channel_messages')
      .select('*, sender:profiles(*)')
      .eq('channel_id', channelId);
    if (!error && data) return data as Message[];
    return [];
  },

  async sendMessage(channelId: string, content: string): Promise<Message | null> {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await (supabase.from('channel_messages') as any)
      .insert({
        channel_id: channelId,
        user_id: userData.user.id,
        content,
      })
      .select('*, sender:profiles(*)')
      .single();
    if (!error && data) return data as Message;
    return null;
  },
};
