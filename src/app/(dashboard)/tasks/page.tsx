import Link from "next/link";
import type { Task } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { requireModuleAccess } from "@/lib/current-org";
import { can } from "@/lib/rbac";

type TaskWithProject = Task & {
  projects?: {
    name: string;
  } | null;
};

export default async function TasksPage() {
  const { supabase, membership, organizationId, user } = await requireModuleAccess("tasks");

  const canViewGlobalTasks = can(membership, "tasks", "view_global");
  let tasksQuery = supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!canViewGlobalTasks) {
    tasksQuery = tasksQuery.or(`owner_id.eq.${user.id},assignee_user_id.eq.${user.id}`);
  }

  const { data: tasks } = await tasksQuery;

  const taskList = (tasks ?? []) as TaskWithProject[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Work items</p>
          <h1>Tasks</h1>
          <p className="muted">Review all tasks your role is allowed to access.</p>
        </div>
      </section>

      <section className="card">
        <div className="table">
          <div className="table-row table-head">
            <span>Task</span>
            <span>Project</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Due date</span>
          </div>

          {taskList.map((task) => (
            <div className="table-row" key={task.id}>
              <span>
                <strong>{task.title}</strong>
                {task.description ? (
                  <p className="muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                    {task.description.slice(0, 60)}{task.description.length > 60 ? "…" : ""}
                  </p>
                ) : null}
              </span>
              <span>
                <Link
                  href={`/projects/${task.project_id}?view=tasks`}
                  style={{ color: "var(--primary)", fontWeight: 500, fontSize: "13px" }}
                >
                  {task.projects?.name || "Unknown"}
                </Link>
              </span>
              <span>
                <StatusBadge value={task.status} />
              </span>
              <span>{task.assignee || "Unassigned"}</span>
              <span>{task.due_date || "No date"}</span>
            </div>
          ))}

          {!taskList.length ? <p className="muted">No visible tasks yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
