import type { Task } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { deleteTask, updateTaskStatus } from "@/app/(dashboard)/actions";

export function TaskCard({
  task,
  canEdit = false,
  canDelete = false
}: {
  task: Task;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  return (
    <article className="task-card">
      <div className="card-header">
        <StatusBadge value={task.status} />
        <PriorityBadge value={task.priority} />
      </div>

      <div>
        <h4>{task.title}</h4>
        <p className="muted">{task.description || "No description."}</p>
      </div>

      <div className="task-meta">
        <span className="task-meta-pill">{task.assignee || "Unassigned"}</span>
        <span className="task-meta-pill">{task.due_date || "No due date"}</span>
      </div>

      {canEdit ? (
        <form action={updateTaskStatus} className="inline-form">
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={task.project_id} />
          <select name="status" defaultValue={task.status}>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Review</option>
            <option>Completed</option>
          </select>
          <button className="button small" type="submit">
            Update
          </button>
        </form>
      ) : null}

      {canDelete ? (
        <form action={deleteTask}>
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={task.project_id} />
          <button className="button danger small" type="submit">
            Delete
          </button>
        </form>
      ) : null}
    </article>
  );
}
