import type { Project, Task } from "@/lib/types";
import { requireModuleAccess } from "@/lib/current-org";

export default async function ReportsPage() {
  const { supabase, organizationId } = await requireModuleAccess("reports");

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").eq("organization_id", organizationId),
    supabase.from("tasks").select("*").eq("organization_id", organizationId)
  ]);

  const projectList = (projects ?? []) as Project[];
  const taskList = (tasks ?? []) as Task[];

  const completedTasks = taskList.filter((task) => task.status === "Completed").length;
  const completionRate = taskList.length ? Math.round((completedTasks / taskList.length) * 100) : 0;

  const totalBudget = projectList.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const activeProjects = projectList.filter((project) => project.status === "In Progress").length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h1>Reports</h1>
          <p className="muted">Simple project, workload, and budget analytics.</p>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <div>
            <p className="muted">Task completion rate</p>
            <h2>{completionRate}%</h2>
            <small>{completedTasks} of {taskList.length} tasks completed</small>
          </div>
        </article>

        <article className="stat-card">
          <div>
            <p className="muted">Active projects</p>
            <h2>{activeProjects}</h2>
            <small>Projects currently in progress</small>
          </div>
        </article>

        <article className="stat-card">
          <div>
            <p className="muted">Total planned budget</p>
            <h2>${totalBudget.toLocaleString()}</h2>
            <small>Across all visible projects</small>
          </div>
        </article>
      </section>

      <section className="two-column">
        <div className="card">
          <h2>Tasks by status</h2>
          {["To Do", "In Progress", "Review", "Completed"].map((status) => {
            const count = taskList.filter((task) => task.status === status).length;
            const percent = taskList.length ? Math.round((count / taskList.length) * 100) : 0;

            return (
              <div className="report-row" key={status}>
                <div className="progress-row">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2>Projects by status</h2>
          {["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"].map((status) => {
            const count = projectList.filter((project) => project.status === status).length;
            const percent = projectList.length ? Math.round((count / projectList.length) * 100) : 0;

            return (
              <div className="report-row" key={status}>
                <div className="progress-row">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
