export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrgRole = 'Admin' | 'Project Manager' | 'Member' | 'Viewer';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          job_title?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          job_title?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          google_drive_folder_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          google_drive_folder_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          google_drive_folder_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: OrgRole
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: OrgRole
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: OrgRole
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          status: ProjectStatus
          priority: ProjectPriority
          due_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          status?: ProjectStatus
          priority?: ProjectPriority
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string | null
          status?: ProjectStatus
          priority?: ProjectPriority
          due_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority
          due_date: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          task_id: string | null
          google_drive_id: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          web_view_link: string | null
          thumbnail_link: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          project_id?: string | null
          task_id?: string | null
          google_drive_id: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          web_view_link?: string | null
          thumbnail_link?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          project_id?: string | null
          task_id?: string | null
          google_drive_id?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          web_view_link?: string | null
          thumbnail_link?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          name: string
          description: string | null
          is_private: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          project_id?: string | null
          name: string
          description?: string | null
          is_private?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      channel_messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          file_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          content: string
          file_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          content?: string
          file_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      direct_messages: {
        Row: {
          id: string
          org_id: string
          sender_id: string
          receiver_id: string
          content: string
          file_id: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          sender_id: string
          receiver_id: string
          content: string
          file_id?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          file_id?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          project_id?: string | null
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          project_id?: string | null
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          org_id: string | null
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id?: string | null
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string | null
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
