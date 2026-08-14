import Link from "next/link";
import { notFound } from "next/navigation";
import type { Channel, Project, ProjectDoc, ProjectMember, Task, TaskComment, WorkspaceFile, Message } from "@/lib/types";
import {
  addTaskComment,
  createProjectMember,
  createTask,
  deleteWorkspaceFile,
  postChannelMessage,
  removeProjectMember,
  saveProjectDoc,
  updateTask,
  updateProjectStatus,
  uploadWorkspaceFile
} from "@/app/(dashboard)/actions";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { TaskCard } from "@/components/task-card";
import { getCurrentOrg } from "@/lib/current-org";
import { can } from "@/lib/rbac";

type ProjectDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function ProjectDetailsPage({ params, searchParams }: ProjectDetailsPageProps) {
  const { id } = await params;
  const { view = "overview" } = await searchParams;
  const { supabase, membership, organizationId, user } = await getCurrentOrg();

  const [
    { data: project },
    { data: tasks },
    { data: members },
    { data: channel },
    { data: docs },
    { data: files },
    { data: messages },
    { data: projectChannels },
    { data: organizationMembers }
  ] =
    await Promise.all([
      supabase.from("projects").select("*").eq("organization_id", organizationId).eq("id", id).single(),
      supabase.from("tasks").select("*").eq("organization_id", organizationId).eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("project_members").select("*").eq("organization_id", organizationId).eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("channels").select("*").eq("organization_id", organizationId).eq("project_id", id).eq("is_default", true).maybeSingle(),
      supabase.from("project_docs").select("*").eq("organization_id", organizationId).eq("project_id", id).order("updated_at", { ascending: false }),
      supabase.from("files").select("*").eq("organization_id", organizationId).eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
      supabase.from("channels").select("*").eq("organization_id", organizationId).eq("project_id", id).order("created_at", { ascending: true }),
      supabase
        .from("organization_members")
        .select("user_id, email, profiles(full_name)")
        .eq("organization_id", organizationId)
    ]);

  if (!project) {
    notFound();
  }

  // RBAC Access Check
  const canViewGlobal = can(membership, "projects", "view_global");
  if (!canViewGlobal) {
    const isOwner = project.owner_id === user.id;
    const isMember = (members ?? []).some((m: any) => m.user_id === user.id);
    if (!isOwner && !isMember) {
      notFound();
    }
  }

  // Scope task comments to tasks in this project only
  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);
  const { data: comments } = taskIds.length
    ? await supabase
        .from("task_comments")
        .select("*")
        .eq("organization_id", organizationId)
        .in("task_id", taskIds)
        .order("created_at", { ascending: false })
    : { data: [] };


  const selectedProject = project as Project;
  const taskList = (tasks ?? []) as Task[];
  const memberList = (members ?? []) as ProjectMember[];
  const docList = (docs ?? []) as ProjectDoc[];
  const fileList = (files ?? []) as WorkspaceFile[];
  const commentList = (comments ?? []) as TaskComment[];
  const projectMessages = ((messages ?? []) as Message[]).filter((message) => message.channel_id === channel?.id && !message.parent_message_id).slice(0, 8);
  const projectChannelList = (projectChannels ?? []) as Channel[];
  const availableMembers = ((organizationMembers ?? []) as Array<{
    user_id: string;
    email: string | null;
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  }>).filter(
    (member) => !memberList.some((projectMember) => projectMember.user_id && projectMember.user_id === member.user_id)
  );
  const completed = taskList.filter((task) => task.status === "Completed").length;
  const progress = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;
  const currentDoc = docList[0];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks" },
    { key: "channel", label: "Channel" },
    { key: "docs", label: "Docs" },
    { key: "files", label: "Files" },
    { key: "members", label: "Members" }
  ];

  return (
    <div className="page-stack">
      <section className="project-hero">
        <div>
          <p className="eyebrow">Project workspace</p>
          <h1>{selectedProject.name}</h1>
          <p>{selectedProject.description || "No project description yet."}</p>
          <div className="badge-row">
            <StatusBadge value={selectedProject.status} />
            <PriorityBadge value={selectedProject.priority} />
            {channel ? (
              <Link className="badge" href={`/channels/${channel.id}`}>
                #{channel.slug}
              </Link>
            ) : null}
          </div>
        </div>

        {can(membership, "projects", "edit") ? (
          <form action={updateProjectStatus} className="status-form">
            <input type="hidden" name="project_id" value={selectedProject.id} />
            <label>
              Update status
              <select name="status" defaultValue={selectedProject.status}>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>On Hold</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </label>
            <button className="button primary" type="submit">
              Save
            </button>
          </form>
        ) : null}
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <div>
            <p className="muted">Start date</p>
            <h2>{selectedProject.start_date || "Not set"}</h2>
          </div>
        </article>
        <article className="stat-card">
          <div>
            <p className="muted">Due date</p>
            <h2>{selectedProject.due_date || "Not set"}</h2>
          </div>
        </article>
        <article className="stat-card">
          <div>
            <p className="muted">Budget</p>
            <h2>{selectedProject.budget ? `$${selectedProject.budget.toLocaleString()}` : "Not set"}</h2>
          </div>
        </article>
        <article className="stat-card">
          <div>
            <p className="muted">Progress</p>
            <h2>{progress}%</h2>
          </div>
        </article>
        <article className="stat-card">
          <div>
            <p className="muted">Team</p>
            <h2>{memberList.length}</h2>
          </div>
        </article>
      </section>

      <nav className="tab-row">
        {tabs.map((tab) => (
          <Link className={`tab-pill ${view === tab.key ? "active" : ""}`} href={`/projects/${selectedProject.id}?view=${tab.key}`} key={tab.key}>
            {tab.label}
          </Link>
        ))}
      </nav>

      {view === "overview" ? (
        <section className="two-column">
          <div className="card">
            <div className="card-header">
              <h2>Latest channel updates</h2>
              {channel ? <Link href={`/channels/${channel.id}`}>Open channel</Link> : null}
            </div>
            <div className="list-stack">
              {projectMessages.map((message) => (
                <div className="list-row" key={message.id}>
                  <div>
                    <strong>{message.body}</strong>
                    <p className="muted">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {!projectMessages.length ? <p className="muted">No channel updates yet.</p> : null}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Project brief</h2>
              <Link href={`/projects/${selectedProject.id}?view=docs`}>Edit docs</Link>
            </div>
            <p className="doc-preview">{currentDoc?.content_json?.text || "No project brief yet."}</p>
          </div>
        </section>
      ) : null}

      {view === "tasks" ? (
        <section className="page-stack" style={{ gap: "2rem" }}>
          <div className="card form-card" style={{ maxWidth: "800px" }}>
            {can(membership, "tasks", "create") ? (
              <>
                <h2>Add task</h2>
                <form action={createTask} className="form-stack">
                  <input type="hidden" name="project_id" value={selectedProject.id} />

                  <label>
                    Task title
                    <input name="title" placeholder="Prepare release checklist" required />
                  </label>

                  <label>
                    Description
                    <textarea name="description" rows={3} placeholder="Task details..." />
                  </label>

                  <div className="form-grid">
                    <label>
                      Status
                      <select name="status" defaultValue="To Do">
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                      </select>
                    </label>

                    <label>
                      Priority
                      <select name="priority" defaultValue="Medium">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Assign to member
                    <select name="assignee_user_id" defaultValue="">
                      <option value="">Unassigned</option>
                      {memberList.filter((member) => member.user_id).map((member) => (
                        <option value={member.user_id ?? ""} key={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Due date
                    <input name="due_date" type="date" />
                  </label>

                  <button className="button primary" type="submit">
                    Add task
                  </button>
                </form>
              </>
            ) : (
              <p className="muted">Your role does not allow task creation.</p>
            )}
          </div>

          <div className="task-list-grid">
            {taskList.map((task) => (
              <div className="task-card-with-comments" key={task.id}>
                <TaskCard
                  task={task}
                  canEdit={can(membership, "tasks", "edit")}
                  canDelete={can(membership, "tasks", "delete")}
                />
                {can(membership, "tasks", "edit") ? (
                  <details style={{ marginTop: "0.5rem" }}>
                    <summary className="button ghost small" style={{ width: "100%", justifyContent: "center", cursor: "pointer", padding: "0.5rem" }}>
                      Edit task details
                    </summary>
                    <form action={updateTask} className="card form-card" style={{ marginTop: "0.5rem", padding: "1rem" }}>
                      <input type="hidden" name="task_id" value={task.id} />
                      <input type="hidden" name="project_id" value={selectedProject.id} />
                      <label>
                        Title
                        <input name="title" defaultValue={task.title} required />
                      </label>
                      <label>
                        Description
                        <textarea name="description" rows={3} defaultValue={task.description ?? ""} />
                      </label>
                      <div className="form-grid">
                        <label>
                          Status
                          <select name="status" defaultValue={task.status}>
                            <option>To Do</option>
                            <option>In Progress</option>
                            <option>Review</option>
                            <option>Completed</option>
                          </select>
                        </label>
                        <label>
                          Priority
                          <select name="priority" defaultValue={task.priority}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-grid">
                        <label>
                          Assignee
                          <select name="assignee_user_id" defaultValue={task.assignee_user_id ?? ""}>
                            <option value="">Unassigned</option>
                            {memberList.filter((member) => member.user_id).map((member) => (
                              <option value={member.user_id ?? ""} key={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Due date
                          <input name="due_date" type="date" defaultValue={task.due_date ?? ""} />
                        </label>
                      </div>
                      <div className="button-row">
                        <button className="button small primary" type="submit">
                          Save task
                        </button>
                        {channel && task.discussion_message_id ? (
                          <Link className="button ghost small" href={`/channels/${channel.id}#message-${task.discussion_message_id}`}>
                            Open thread
                          </Link>
                        ) : null}
                      </div>
                    </form>
                  </details>
                ) : null}
                <div className="comment-stack">
                  {commentList
                    .filter((comment) => comment.task_id === task.id)
                    .slice(0, 2)
                    .map((comment) => (
                      <div className="thread-item" key={comment.id}>
                        <strong>Comment</strong>
                        <p className="muted">{comment.body}</p>
                      </div>
                    ))}

                  <form action={addTaskComment} className="inline-form">
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="project_id" value={selectedProject.id} />
                    <input name="body" placeholder="Add quick comment..." />
                    <button className="button small" type="submit">
                      Comment
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {!taskList.length ? <p className="muted">No tasks created yet.</p> : null}
          </div>
        </section>
      ) : null}

      {view === "channel" ? (
        <section className="conversation-layout">
          <div className="card">
            <div className="card-header">
              <h2>Project channels</h2>
              {channel ? (
                <Link className="inline-link" href={`/channels/${channel.id}`}>
                  Open home channel
                </Link>
              ) : null}
            </div>
            <div className="list-stack">
              {projectChannelList.map((projectChannel) => (
                <Link className="list-row" href={`/channels/${projectChannel.id}`} key={projectChannel.id}>
                  <div>
                    <strong>#{projectChannel.slug}</strong>
                    <p className="muted">{projectChannel.purpose || projectChannel.channel_kind}</p>
                  </div>
                  <span>{projectChannel.channel_kind}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card conversation-card">
            <div className="message-list">
              {projectMessages.map((message) => (
                <article className="message-card" id={`message-${message.id}`} key={message.id}>
                  <p>{message.body}</p>
                  <small>{new Date(message.created_at).toLocaleString()}</small>
                </article>
              ))}
              {!projectMessages.length ? <p className="muted">No messages in the project channel yet.</p> : null}
            </div>
          </div>

          <form action={postChannelMessage} className="card form-card">
            <h2>Post update</h2>
            <input type="hidden" name="channel_id" value={channel?.id ?? ""} />
            <textarea name="body" rows={5} placeholder="Share a status update, decision, or blocker..." required />
            <button className="button primary" type="submit" disabled={!channel}>
              Send
            </button>
          </form>
        </section>
      ) : null}

      {view === "docs" ? (
        <section className="split-layout">
          <form action={saveProjectDoc} className="card form-card">
            <h2>Project overview doc</h2>
            <input type="hidden" name="project_id" value={selectedProject.id} />
            <label>
              Title
              <input name="title" defaultValue={currentDoc?.title || "Project overview"} />
            </label>
            <label>
              Content
              <textarea name="content" rows={18} defaultValue={currentDoc?.content_json?.text || ""} />
            </label>
            <button className="button primary" type="submit">
              Save doc
            </button>
          </form>

          <div className="card">
            <div className="card-header">
              <h2>Doc preview</h2>
              <span>{docList.length} docs</span>
            </div>
            <p className="doc-preview">{currentDoc?.content_json?.text || "Nothing written yet."}</p>
          </div>
        </section>
      ) : null}

      {view === "files" ? (
        <section className="split-layout">
          <form action={uploadWorkspaceFile} className="card form-card">
            <h2>Upload project file</h2>
            <input type="hidden" name="project_id" value={selectedProject.id} />
            <input type="hidden" name="scope" value="project" />
            <input name="file" type="file" required />
            <button className="button primary" type="submit">
              Upload
            </button>
          </form>

          <div className="card">
            <h2>Project files</h2>
            <div className="list-stack">
              {fileList.map((file) => (
                <div className="list-row" key={file.id}>
                  <div>
                    <strong>{file.file_name}</strong>
                    <p className="muted">{file.scope} · {file.storage_provider === "google_drive" ? "Google Drive" : "Legacy storage"}</p>
                  </div>
                  <div className="row-end">
                    <span>{file.size_bytes ? `${Math.ceil(file.size_bytes / 1024)} KB` : "Unknown size"}</span>
                    {file.drive_web_view_link || file.drive_download_link ? (
                      <Link className="button small" href={file.drive_web_view_link || file.drive_download_link || "#"} target="_blank">
                        Open
                      </Link>
                    ) : null}
                    <form action={deleteWorkspaceFile}>
                      <input type="hidden" name="file_id" value={file.id} />
                      <button className="button danger small" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {!fileList.length ? <p className="muted">No files uploaded for this project yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {view === "members" ? (
        <section className="split-layout">
          <div className="card form-card">
            {can(membership, "team", "create") ? (
              <>
                <h2>Add project member</h2>
                <form action={createProjectMember} className="form-stack">
                  <input type="hidden" name="project_id" value={selectedProject.id} />

                  <label>
                    Staff member
                    <select name="member_user_id" required defaultValue="">
                      <option value="">Select a staff member</option>
                      {availableMembers.map((member) => {
                        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                        const label = profile?.full_name || member.email || "Teammate";
                        return (
                          <option value={member.user_id} key={member.user_id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label>
                    Role
                    <input name="role" placeholder="Developer" />
                  </label>

                  <button className="button primary" type="submit">
                    Add member
                  </button>
                </form>
              </>
            ) : (
              <p className="muted">Your role does not allow adding project members.</p>
            )}
          </div>

          <div className="card">
            <h2>Project members</h2>
            <div className="list-stack">
              {memberList.map((member) => (
                <div className="list-row" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <p className="muted">{member.role || "Member"}</p>
                  </div>
                  <div className="row-end">
                    <span>{member.email || "No email"}</span>
                    {can(membership, "team", "edit") ? (
                      <form action={removeProjectMember}>
                        <input type="hidden" name="project_member_id" value={member.id} />
                        <input type="hidden" name="project_id" value={selectedProject.id} />
                        <button className="button danger small" type="submit">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
              {!memberList.length ? <p className="muted">No project members added yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
