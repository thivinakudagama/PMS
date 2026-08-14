import { CheckCircle2, FolderKanban, ListTodo, AlertTriangle } from "lucide-react";
import type { Project, Task } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { requireModuleAccess } from "@/lib/current-org";
import { can } from "@/lib/rbac";

export default async function DashboardPage() {
  const { supabase, membership, organizationId, user } = await requireModuleAccess("dashboard");

  // RBAC Scoping Logic
  const canViewGlobalProjects = can(membership, "projects", "view_global");
  let projectsQuery = supabase.from("projects").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
  let myProjectIds: string[] = [];

  if (!canViewGlobalProjects) {
    const { data: myMemberships } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
    myProjectIds = (myMemberships ?? []).map((m: any) => m.project_id);
    if (myProjectIds.length > 0) {
      projectsQuery = projectsQuery.or(`owner_id.eq.${user.id},id.in.(${myProjectIds.join(",")})`);
    } else {
      projectsQuery = projectsQuery.eq("owner_id", user.id);
    }
  }

  const canViewGlobalTasks = can(membership, "tasks", "view_global");
  let tasksQuery = supabase.from("tasks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (!canViewGlobalTasks) {
    tasksQuery = tasksQuery.or(`owner_id.eq.${user.id},assignee_user_id.eq.${user.id}`);
  }

  const [{ data: projects }, { data: tasks }, { count: unreadNotifications }] = await Promise.all([
    projectsQuery,
    tasksQuery,
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("is_read", false)
  ]);

  const projectList = (projects ?? []) as Project[];
  const taskList = (tasks ?? []) as Task[];

  const activeProjects = projectList.filter((project) => project.status === "In Progress").length;
  const completedTasks = taskList.filter((task) => task.status === "Completed").length;
  const pendingTasks = taskList.filter((task) => task.status !== "Completed").length;
  const overdueTasks = taskList.filter((task) => {
    if (!task.due_date || task.status === "Completed") return false;
    return new Date(task.due_date) < new Date();
  }).length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p className="muted">Track your project portfolio, pending work, and upcoming deadlines.</p>
        </div>
        {can(membership, "projects", "create") ? (
          <Link href="/projects" className="button primary">
            New project
          </Link>
        ) : null}
      </section>

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Today at a glance</p>
          <h2>Keep delivery moving with fewer blind spots.</h2>
          <p className="muted">
            Review active projects, clear overdue work, and respond to new notifications before they become blockers.
          </p>
        </div>

        <div className="dashboard-hero-metrics">
          <div className="hero-metric">
            <span className="metric-label">Active Projects</span>
            <span className="metric-value">{activeProjects}</span>
          </div>
          <div className="hero-metric">
            <span className="metric-label">Pending Tasks</span>
            <span className="metric-value">{pendingTasks}</span>
          </div>
          <div className="hero-metric">
            <span className="metric-label">Overdue</span>
            <span className="metric-value attention">{overdueTasks}</span>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard title="Projects" value={projectList.length} icon={FolderKanban} description="Total workspace projects" />
        <StatCard title="Tasks Completed" value={completedTasks} icon={CheckCircle2} description="Across all projects" />
        <StatCard title="Open Tasks" value={pendingTasks} icon={ListTodo} description="Awaiting action" />
        <StatCard
          title="Notifications"
          value={unreadNotifications ?? 0}
          icon={AlertTriangle}
          description="Unread alerts"
        />
      </section>

      <section className="split-layout">
        <div className="card">
          <h2>Recent Projects</h2>
          <div className="list-stack">
            {projectList.slice(0, 5).map((project) => (
              <div className="list-row" key={project.id}>
                <span>
                  <strong>
                    <Link href={`/projects/${project.id}`}>{project.name}</Link>
                  </strong>
                  <p className="muted">{project.description?.slice(0, 60) || "No description"}</p>
                </span>
                <StatusBadge value={project.status} />
              </div>
            ))}
            {!projectList.length ? <p className="muted">No projects found.</p> : null}
          </div>
        </div>

        <div className="card">
          <h2>Recent Tasks</h2>
          <div className="list-stack">
            {taskList.slice(0, 5).map((task) => (
              <div className="list-row" key={task.id}>
                <span>
                  <strong>
                    <Link href={`/projects/${task.project_id}?view=tasks`}>{task.title}</Link>
                  </strong>
                  <p className="muted">Due: {task.due_date || "No date"}</p>
                </span>
                <StatusBadge value={task.status} />
              </div>
            ))}
            {!taskList.length ? <p className="muted">No tasks found.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
