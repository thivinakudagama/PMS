import Link from "next/link";
import type { Project, Task } from "@/lib/types";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { deleteProject } from "@/app/(dashboard)/actions";

type ProjectCardProps = {
  project: Project;
  tasks: Task[];
  canDelete?: boolean;
};

export function ProjectCard({ project, tasks, canDelete = false }: ProjectCardProps) {
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <article className="card project-card">
      <div className="card-header">
        <div>
          <h3>{project.name}</h3>
          <p className="muted">{project.description || "No description yet."}</p>
        </div>
        <StatusBadge value={project.status} />
      </div>

      <div className="meta-grid meta-grid-compact">
        <span>
          <strong>Priority</strong>
          <PriorityBadge value={project.priority} />
        </span>
        <span>
          <strong>Due</strong>
          {project.due_date || "Not set"}
        </span>
        <span>
          <strong>Budget</strong>
          {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
        </span>
      </div>

      <div>
        <div className="progress-row">
          <span className="section-kicker">Progress</span>
          <strong>{progress}% complete</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="button-row">
        <Link href={`/projects/${project.id}`} className="button primary small">
          View details
        </Link>

        {canDelete ? (
          <form action={deleteProject}>
            <input type="hidden" name="project_id" value={project.id} />
            <button className="button danger small" type="submit">
              Delete
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
