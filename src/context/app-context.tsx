'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { dataService } from '@/lib/services/data-service';

interface AppContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  currentUser: UserProfile | null;
  currentUserRole: 'Admin' | 'Project Manager' | 'Member' | 'Viewer' | null;
  isSuperAdmin: boolean;
  projects: Project[];
  tasks: Task[];
  members: OrganizationMember[];
  files: FileItem[];
  channels: Channel[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  loading: boolean;

  // Actions
  switchOrganization: (org: Organization) => void;
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  createProject: (project: Partial<Project> & { title: string }) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (task: Partial<Task> & { title: string; project_id: string }) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addMember: (email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => Promise<void>;
  updateMemberRole: (memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addFile: (file: Partial<FileItem> & { name: string }) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<Message | null>;
  markNotificationRead: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfileAndOrgs = useCallback(async (userId: string) => {
    const profile = await dataService.getUserProfile(userId);
    if (!profile) return;
    setCurrentUser(profile);

    const superAdminCheck = await dataService.checkIsSuperAdmin(userId);
    setIsSuperAdmin(superAdminCheck);

    const orgs = await dataService.getOrganizations();
    if (orgs.length > 0) {
      setOrganizations(orgs);
      setCurrentOrg(orgs[0]);
    } else {
      // Auto create org if none exists (using metadata from signup)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.org_name) {
        const slug = user.user_metadata.org_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const newOrg = await dataService.createOrganization(user.user_metadata.org_name, slug);
        if (newOrg) {
          await dataService.addMember(newOrg.id, user.email || '', 'Admin', user.id);
          setOrganizations([newOrg]);
          setCurrentOrg(newOrg);
        }
      }
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfileAndOrgs(session.user.id);
      } else {
        setLoading(false);
        // Only redirect if on dashboard routes
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          router.push('/login');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfileAndOrgs(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentOrg(null);
        setIsSuperAdmin(false);
        setOrganizations([]);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          router.push('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfileAndOrgs, router]);

  const loadOrgData = useCallback(async (orgId: string) => {
    setLoading(true);
    const [pList, tList, mList, fList, cList, aList, nList] = await Promise.all([
      dataService.getProjects(orgId),
      dataService.getTasks(orgId),
      dataService.getMembers(orgId),
      dataService.getFiles(orgId),
      dataService.getChannels(orgId),
      dataService.getActivities(orgId),
      dataService.getNotifications(),
    ]);

    setProjects(pList);
    setTasks(tList);
    setMembers(mList);
    setFiles(fList);
    setChannels(cList);
    setActivities(aList);
    setNotifications(nList);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentOrg) {
      loadOrgData(currentOrg.id);
    }
  }, [currentOrg, loadOrgData]);

  const refreshData = async () => {
    if (currentOrg) {
      await loadOrgData(currentOrg.id);
    }
  };

  const switchOrganization = (org: Organization) => {
    setCurrentOrg(org);
  };

  const createOrganization = async (name: string, slug: string): Promise<Organization | null> => {
    const newOrg = await dataService.createOrganization(name, slug);
    if (newOrg) {
      setOrganizations((prev) => [newOrg, ...prev]);
      setCurrentOrg(newOrg);
    }
    return newOrg;
  };

  const createProject = async (projectData: Partial<Project> & { title: string }): Promise<Project | null> => {
    if (!currentOrg) return null;
    const newProj = await dataService.createProject({ ...projectData, org_id: currentOrg.id });
    if (newProj) {
      setProjects((prev) => [newProj, ...prev]);
      await dataService.logActivity(currentOrg.id, `created new project "${newProj.title}"`, 'project', newProj.id);
      const updatedActivities = await dataService.getActivities(currentOrg.id);
      setActivities(updatedActivities);
    }
    return newProj;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await dataService.updateProject(id, updates);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  };

  const deleteProject = async (id: string) => {
    const success = await dataService.deleteProject(id);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const createTask = async (taskData: Partial<Task> & { title: string; project_id: string }): Promise<Task | null> => {
    const newTask = await dataService.createTask(taskData);
    if (newTask) {
      setTasks((prev) => [newTask, ...prev]);
      if (currentOrg) {
        await dataService.logActivity(currentOrg.id, `created task "${newTask.title}"`, 'task', newTask.id);
        const updatedActivities = await dataService.getActivities(currentOrg.id);
        setActivities(updatedActivities);
      }
    }
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await dataService.updateTask(id, updates);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (currentOrg && updates.status) {
        await dataService.logActivity(currentOrg.id, `updated task status to "${updates.status.replace('_', ' ')}"`, 'task', id);
        const updatedActivities = await dataService.getActivities(currentOrg.id);
        setActivities(updatedActivities);
      }
    }
  };

  const deleteTask = async (id: string) => {
    const success = await dataService.deleteTask(id);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const addMember = async (email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => {
    if (!currentOrg) return;
    try {
      const newMember = await dataService.inviteMember(currentOrg.id, email, role);
      if (newMember) {
        setMembers((prev) => [newMember, ...prev]);
        await dataService.logActivity(currentOrg.id, `invited ${email} as ${role}`, 'member', newMember.id);
        const updatedActivities = await dataService.getActivities(currentOrg.id);
        setActivities(updatedActivities);
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error; // Re-throw so the UI can catch and display the error message
    }
  };

  const updateMemberRole = async (memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => {
    const updated = await dataService.updateMemberRole(memberId, role);
    if (updated) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
  };

  const removeMember = async (memberId: string) => {
    const success = await dataService.removeMember(memberId);
    if (success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  const addFile = async (fileData: Partial<FileItem> & { name: string }) => {
    if (!currentOrg) return;
    const newFile = await dataService.addFile({ ...fileData, org_id: currentOrg.id });
    if (newFile) {
      setFiles((prev) => [newFile, ...prev]);
    }
  };

  const sendMessage = async (channelId: string, content: string): Promise<Message | null> => {
    const msg = await dataService.sendMessage(channelId, content);
    return msg;
  };

  const markNotificationRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const currentUserRole = currentUser ? (members.find(m => m.user_id === currentUser.id)?.role as 'Admin' | 'Project Manager' | 'Member' | 'Viewer') || null : null;

  return (
    <AppContext.Provider
      value={{
        organizations,
        currentOrg,
        currentUser,
        currentUserRole,
        isSuperAdmin,
        projects,
        tasks,
        members,
        files,
        channels,
        activities,
        notifications,
        loading,
        switchOrganization,
        createOrganization,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        addMember,
        updateMemberRole,
        removeMember,
        addFile,
        sendMessage,
        markNotificationRead,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
