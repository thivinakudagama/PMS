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
import {
  MOCK_ORGANIZATIONS,
  MOCK_PROFILES,
  MOCK_ORG_MEMBERS,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_FILES,
  MOCK_CHANNELS,
  MOCK_MESSAGES,
  MOCK_ACTIVITIES,
  MOCK_NOTIFICATIONS,
} from '@/lib/mock-data';

const STORAGE_KEY_PREFIX = 'pms_v1_';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('example.supabase.co'));
}

function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage`, err);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage`, err);
  }
}

// Data Service Implementation
export const dataService = {
  // --- ORGANIZATIONS ---
  async getOrganizations(): Promise<Organization[]> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('organizations') as any).select('*');
      if (!error && data && data.length > 0) return data as Organization[];
    }
    return getStoredItem<Organization[]>('organizations', MOCK_ORGANIZATIONS);
  },

  async createOrganization(name: string, slug: string): Promise<Organization> {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('organizations') as any)
        .insert({ name, slug: newOrg.slug })
        .select()
        .single();
      if (!error && data) return data as Organization;
    }

    const orgs = await this.getOrganizations();
    const updated = [newOrg, ...orgs];
    setStoredItem('organizations', updated);
    return newOrg;
  },

  // --- PROJECTS ---
  async getProjects(orgId: string): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('projects') as any).select('*').eq('org_id', orgId);
      if (!error && data) return data as Project[];
    }
    const projects = getStoredItem<Project[]>('projects', MOCK_PROJECTS);
    return projects.filter((p) => p.org_id === orgId || !p.org_id);
  },

  async createProject(project: Partial<Project> & { title: string; org_id: string }): Promise<Project> {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      org_id: project.org_id,
      title: project.title,
      description: project.description || '',
      status: project.status || 'active',
      priority: project.priority || 'medium',
      due_date: project.due_date || new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      task_count: 0,
      completed_task_count: 0,
      members: project.members || [MOCK_PROFILES[0]],
    };

    if (isSupabaseConfigured()) {
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
    }

    const allProjects = getStoredItem<Project[]>('projects', MOCK_PROJECTS);
    const updated = [newProject, ...allProjects];
    setStoredItem('projects', updated);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('projects') as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Project;
    }

    const allProjects = getStoredItem<Project[]>('projects', MOCK_PROJECTS);
    let updatedProj: Project | null = null;
    const updatedList = allProjects.map((p) => {
      if (p.id === id) {
        updatedProj = { ...p, ...updates };
        return updatedProj;
      }
      return p;
    });
    setStoredItem('projects', updatedList);
    return updatedProj;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await (supabase.from('projects') as any).delete().eq('id', id);
      if (!error) return true;
    }

    const allProjects = getStoredItem<Project[]>('projects', MOCK_PROJECTS);
    const updated = allProjects.filter((p) => p.id !== id);
    setStoredItem('projects', updated);
    return true;
  },

  // --- TASKS ---
  async getTasks(orgId: string): Promise<Task[]> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('tasks') as any).select('*');
      if (!error && data) return data as Task[];
    }
    return getStoredItem<Task[]>('tasks', MOCK_TASKS);
  },

  async createTask(task: Partial<Task> & { title: string; project_id: string }): Promise<Task> {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      project_id: task.project_id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date || new Date(Date.now() + 7 * 86400000).toISOString(),
      assignee: task.assignee || MOCK_PROFILES[0],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
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
    }

    const allTasks = getStoredItem<Task[]>('tasks', MOCK_TASKS);
    const updated = [newTask, ...allTasks];
    setStoredItem('tasks', updated);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('tasks') as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Task;
    }

    const allTasks = getStoredItem<Task[]>('tasks', MOCK_TASKS);
    let updatedTask: Task | null = null;
    const updatedList = allTasks.map((t) => {
      if (t.id === id) {
        updatedTask = { ...t, ...updates };
        return updatedTask;
      }
      return t;
    });
    setStoredItem('tasks', updatedList);
    return updatedTask;
  },

  async deleteTask(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await (supabase.from('tasks') as any).delete().eq('id', id);
      if (!error) return true;
    }

    const allTasks = getStoredItem<Task[]>('tasks', MOCK_TASKS);
    const updated = allTasks.filter((t) => t.id !== id);
    setStoredItem('tasks', updated);
    return true;
  },

  // --- TEAM MEMBERS & ROLES ---
  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await (supabase.from('organization_members') as any)
        .select('*, user:profiles(*)')
        .eq('org_id', orgId);
      if (!error && data) return data as OrganizationMember[];
    }
    const members = getStoredItem<OrganizationMember[]>('members', MOCK_ORG_MEMBERS);
    return members.filter((m) => m.org_id === orgId || !m.org_id);
  },

  async addMember(orgId: string, email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer'): Promise<OrganizationMember> {
    const name = email.split('@')[0].replace('.', ' ');
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: name.charAt(0).toUpperCase() + name.slice(1),
      job_title: 'Team Specialist',
      department: 'Engineering',
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150`,
    };

    const newMember: OrganizationMember = {
      id: `mem-${Date.now()}`,
      org_id: orgId,
      user_id: newProfile.id,
      role,
      user: newProfile,
    };

    const allMembers = getStoredItem<OrganizationMember[]>('members', MOCK_ORG_MEMBERS);
    const updated = [newMember, ...allMembers];
    setStoredItem('members', updated);
    return newMember;
  },

  async updateMemberRole(memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer'): Promise<OrganizationMember | null> {
    const allMembers = getStoredItem<OrganizationMember[]>('members', MOCK_ORG_MEMBERS);
    let updatedMember: OrganizationMember | null = null;
    const updated = allMembers.map((m) => {
      if (m.id === memberId) {
        updatedMember = { ...m, role };
        return updatedMember;
      }
      return m;
    });
    setStoredItem('members', updated);
    return updatedMember;
  },

  // --- FILES ---
  async getFiles(orgId: string): Promise<FileItem[]> {
    return getStoredItem<FileItem[]>('files', MOCK_FILES);
  },

  async addFile(file: Partial<FileItem> & { name?: string; org_id?: string }): Promise<FileItem> {
    const fname = file.name || file.file_name || 'Document.pdf';
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      org_id: file.org_id || 'org-acme',
      file_name: fname,
      file_size: 1024 * 1024 * 2.5,
      mime_type: file.mime_type || 'application/pdf',
      google_drive_id: `gdrive-${Date.now()}`,
      web_view_link: file.web_view_link || '#',
      uploaded_by: file.uploaded_by || 'usr-1',
      created_at: new Date().toISOString(),
      uploader: MOCK_PROFILES[0],
    };
    const allFiles = getStoredItem<FileItem[]>('files', MOCK_FILES);
    const updated = [newFile, ...allFiles];
    setStoredItem('files', updated);
    return newFile;
  },

  // --- ACTIVITIES & NOTIFICATIONS ---
  async getActivities(orgId: string): Promise<ActivityLog[]> {
    return getStoredItem<ActivityLog[]>('activities', MOCK_ACTIVITIES);
  },

  async logActivity(orgId: string, action: string, entityType: string, entityId?: string, metadata?: any): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      org_id: orgId,
      user_id: MOCK_PROFILES[0].id,
      action,
      entity_type: entityType as 'project' | 'task' | 'file' | 'member' | 'channel',
      entity_id: entityId,
      created_at: new Date().toISOString(),
      user: MOCK_PROFILES[0],
    };
    const logs = getStoredItem<ActivityLog[]>('activities', MOCK_ACTIVITIES);
    const updated = [newLog, ...logs];
    setStoredItem('activities', updated);
    return newLog;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return getStoredItem<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  },

  async markNotificationRead(id: string): Promise<void> {
    const notifs = getStoredItem<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setStoredItem('notifications', updated);
  },

  // --- CHANNELS & MESSAGES ---
  async getChannels(orgId: string): Promise<Channel[]> {
    return getStoredItem<Channel[]>('channels', MOCK_CHANNELS);
  },

  async getMessages(channelId: string): Promise<Message[]> {
    const messages = getStoredItem<Message[]>('messages', MOCK_MESSAGES);
    return messages.filter((m) => m.channel_id === channelId || !m.channel_id);
  },

  async sendMessage(channelId: string, content: string): Promise<Message> {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      channel_id: channelId,
      sender_id: MOCK_PROFILES[0].id,
      content,
      created_at: new Date().toISOString(),
      sender: MOCK_PROFILES[0],
    };
    const all = getStoredItem<Message[]>('messages', MOCK_MESSAGES);
    const updated = [...all, newMsg];
    setStoredItem('messages', updated);
    return newMsg;
  },
};
