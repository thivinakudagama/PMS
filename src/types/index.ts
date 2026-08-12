import { OrgRole, ProjectPriority, ProjectStatus, TaskPriority, TaskStatus } from './database.types';

export * from './database.types';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  job_title?: string;
  department?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  google_drive_folder_id?: string;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  user?: UserProfile;
}

export interface Project {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  due_date?: string;
  created_by?: string;
  created_at: string;
  task_count?: number;
  completed_task_count?: number;
  members?: UserProfile[];
}

export interface Task {
  id: string;
  project_id: string;
  project_title?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  assignee?: UserProfile;
  created_by?: string;
  created_at: string;
}

export interface FileItem {
  id: string;
  org_id: string;
  project_id?: string;
  project_title?: string;
  task_id?: string;
  google_drive_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  web_view_link: string;
  thumbnail_link?: string;
  uploaded_by: string;
  uploader?: UserProfile;
  created_at: string;
}

export interface Channel {
  id: string;
  org_id: string;
  project_id?: string;
  name: string;
  description?: string;
  is_private: boolean;
  unread_count?: number;
}

export interface Message {
  id: string;
  channel_id?: string;
  org_id?: string;
  sender_id: string;
  receiver_id?: string;
  sender?: UserProfile;
  content: string;
  file_id?: string;
  file?: FileItem;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  org_id: string;
  project_id?: string;
  user_id: string;
  user?: UserProfile;
  action: string;
  entity_type: 'project' | 'task' | 'file' | 'member' | 'channel';
  entity_id?: string;
  entity_title?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  org_id?: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
