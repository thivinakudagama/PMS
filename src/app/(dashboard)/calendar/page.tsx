import Link from "next/link";
import type { Project, Task } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { requireModuleAccess } from "@/lib/current-org";

import { can } from "@/lib/rbac";

export default async function CalendarPage() {
  const { supabase, membership, organizationId, user } = await requireModuleAccess("dashboard");

  // RBAC Scoping Logic
  const canViewGlobalProjects = can(membership, "projects", "view_global");
  let projectsQuery = supabase.from("projects").select("*").eq("organization_id", organizationId).not("due_date", "is", null);
  
  if (!canViewGlobalProjects) {
    const { data: myMemberships } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
    const myProjectIds = (myMemberships ?? []).map((m: any) => m.project_id);
    if (myProjectIds.length > 0) {
      projectsQuery = projectsQuery.or(`owner_id.eq.${user.id},id.in.(${myProjectIds.join(",")})`);
    } else {
      projectsQuery = projectsQuery.eq("owner_id", user.id);
    }
  }

  const canViewGlobalTasks = can(membership, "tasks", "view_global");
  let tasksQuery = supabase.from("tasks").select("*").eq("organization_id", organizationId).not("due_date", "is", null);
  
  if (!canViewGlobalTasks) {
    tasksQuery = tasksQuery.or(`owner_id.eq.${user.id},assignee_user_id.eq.${user.id}`);
  }

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    projectsQuery,
    tasksQuery
  ]);

  const items = [
    ...((projects ?? []) as Project[]).map((project) => ({
      id: project.id,
      date: project.due_date!,
      title: project.name,
      type: "Project deadline",
      status: project.status,
      href: `/projects/${project.id}`
    })),
    ...((tasks ?? []) as Task[]).map((task) => ({
      id: task.id,
      date: task.due_date!,
      title: task.title,
      type: "Task due",
      status: task.status,
      href: `/projects/${task.project_id}?view=tasks`
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Schedule</p>
          <h1>Calendar</h1>
          <p className="muted">A deadline-focused view of projects and tasks you can access.</p>
        </div>
      </section>

      <section className="card">
        <div className="list-stack">
          {items.map((item) => (
            <Link className="list-row" href={item.href} key={`${item.type}-${item.id}`}>
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.type}</p>
              </div>
              <div className="row-end">
                <StatusBadge value={item.status} />
                <span>{item.date}</span>
              </div>
            </Link>
          ))}

          {!items.length ? <p className="muted">No upcoming deadlines yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
