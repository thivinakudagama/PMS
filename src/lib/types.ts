export type ProjectStatus = "Not Started" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed";
export type ChannelType = "workspace" | "project";
export type ChannelKind = "home" | "subchannel" | "standard";
export type ConversationType = "direct" | "group";
export type NotificationType =
  | "mention"
  | "assignment"
  | "reply"
  | "due_soon"
  | "automation"
  | "project_update"
  | "task_update";
export type ActivityEntityType = "project" | "task" | "message" | "doc" | "member" | "file";
export type FileScope = "workspace" | "project" | "task" | "channel" | "message" | "doc";

export type Project = {
  id: string;
  organization_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  organization_id: string;
  owner_id: string;
  project_id: string;
  assignee_user_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  discussion_message_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  organization_id: string;
  owner_id: string;
  project_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: string | null;
  created_at: string;
};

export type Channel = {
  id: string;
  organization_id: string;
  project_id: string | null;
  parent_channel_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  type: ChannelType;
  channel_kind: ChannelKind;
  purpose: string | null;
  is_private: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  organization_id: string;
  type: ConversationType;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  organization_id: string;
  channel_id: string | null;
  conversation_id: string | null;
  parent_message_id: string | null;
  sender_user_id: string;
  body: string;
  mentions: string[] | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectDoc = {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  content_json: {
    text?: string;
  } | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceFile = {
  id: string;
  organization_id: string;
  project_id: string | null;
  task_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  uploaded_by: string;
  bucket_name: string | null;
  storage_path: string | null;
  storage_provider: "supabase" | "google_drive";
  drive_file_id: string | null;
  drive_folder_id: string | null;
  drive_web_view_link: string | null;
  drive_download_link: string | null;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  scope: FileScope;
  created_at: string;
};

export type Notification = {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  project_id: string | null;
  task_id: string | null;
  channel_id: string | null;
  entity_type: ActivityEntityType;
  event_type: string;
  title: string;
  detail: string | null;
  created_at: string;
};

export type TaskComment = {
  id: string;
  organization_id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
