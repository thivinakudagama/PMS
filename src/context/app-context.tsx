'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { MOCK_PROFILES } from '@/lib/mock-data';

interface AppContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  currentUser: UserProfile;
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
  createOrganization: (name: string, slug: string) => Promise<Organization>;
  createProject: (project: Partial<Project> & { title: string }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (task: Partial<Task> & { title: string; project_id: string }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addMember: (email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => Promise<void>;
  updateMemberRole: (memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => Promise<void>;
  addFile: (file: Partial<FileItem> & { name: string }) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<Message>;
  markNotificationRead: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentUser] = useState<UserProfile>(MOCK_PROFILES[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial organizations
  useEffect(() => {
    async function loadOrgs() {
      setLoading(true);
      const orgs = await dataService.getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
      setLoading(false);
    }
    loadOrgs();
  }, []);

  // Fetch org-specific resources whenever currentOrg changes
  const loadOrgData = useCallback(async (orgId: string) => {
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

  const createOrganization = async (name: string, slug: string): Promise<Organization> => {
    const newOrg = await dataService.createOrganization(name, slug);
    setOrganizations((prev) => [newOrg, ...prev]);
    setCurrentOrg(newOrg);
    return newOrg;
  };

  const createProject = async (projectData: Partial<Project> & { title: string }): Promise<Project> => {
    const orgId = currentOrg ? currentOrg.id : 'org-acme';
    const newProj = await dataService.createProject({ ...projectData, org_id: orgId });
    setProjects((prev) => [newProj, ...prev]);
    await dataService.logActivity(orgId, `created new project "${newProj.title}"`, 'project', newProj.id);
    const updatedActivities = await dataService.getActivities(orgId);
    setActivities(updatedActivities);
    return newProj;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await dataService.updateProject(id, updates);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  };

  const deleteProject = async (id: string) => {
    await dataService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const createTask = async (taskData: Partial<Task> & { title: string; project_id: string }): Promise<Task> => {
    const newTask = await dataService.createTask(taskData);
    setTasks((prev) => [newTask, ...prev]);
    if (currentOrg) {
      await dataService.logActivity(currentOrg.id, `created task "${newTask.title}"`, 'task', newTask.id);
      const updatedActivities = await dataService.getActivities(currentOrg.id);
      setActivities(updatedActivities);
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
    await dataService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addMember = async (email: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => {
    if (!currentOrg) return;
    const newMember = await dataService.addMember(currentOrg.id, email, role);
    setMembers((prev) => [newMember, ...prev]);
    await dataService.logActivity(currentOrg.id, `invited ${email} as ${role}`, 'member', newMember.id);
    const updatedActivities = await dataService.getActivities(currentOrg.id);
    setActivities(updatedActivities);
  };

  const updateMemberRole = async (memberId: string, role: 'Admin' | 'Project Manager' | 'Member' | 'Viewer') => {
    const updated = await dataService.updateMemberRole(memberId, role);
    if (updated) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
  };

  const addFile = async (fileData: Partial<FileItem> & { name: string }) => {
    if (!currentOrg) return;
    const newFile = await dataService.addFile({ ...fileData, org_id: currentOrg.id });
    setFiles((prev) => [newFile, ...prev]);
  };

  const sendMessage = async (channelId: string, content: string): Promise<Message> => {
    const msg = await dataService.sendMessage(channelId, content);
    return msg;
  };

  const markNotificationRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        organizations,
        currentOrg,
        currentUser,
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
