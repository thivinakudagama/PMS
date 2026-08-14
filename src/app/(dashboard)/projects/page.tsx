import type { Project, Task } from "@/lib/types";
import { ProjectForm } from "@/components/project-form";
import { ProjectCard } from "@/components/project-card";
import { requireModuleAccess } from "@/lib/current-org";
import { can } from "@/lib/rbac";

type ProjectsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const { supabase, membership, organizationId, user } = await requireModuleAccess("projects");

  // RBAC Scoping Logic
  const canViewGlobalProjects = can(membership, "projects", "view_global");
  let projectsQuery = supabase.from("projects").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
  
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
  let tasksQuery = supabase.from("tasks").select("*").eq("organization_id", organizationId);
  if (!canViewGlobalTasks) {
    tasksQuery = tasksQuery.or(`owner_id.eq.${user.id},assignee_user_id.eq.${user.id}`);
  }

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    projectsQuery,
    tasksQuery
  ]);

  const projectList = (projects ?? []) as Project[];
  const taskList = (tasks ?? []) as Task[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1>Projects</h1>
          <p className="muted">Create, monitor, and organize all active project work.</p>
        </div>
      </section>

      {params.error ? <div className="alert error">{params.error}</div> : null}
      {params.message ? <div className="alert success">{params.message}</div> : null}

      <section className="split-layout">
        {can(membership, "projects", "create") ? (
          <ProjectForm />
        ) : (
          <div className="card empty-state">
            <h2>View-only access</h2>
            <p className="muted">Your role does not allow project creation.</p>
          </div>
        )}

        <div className="project-grid">
          {projectList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={taskList.filter((task) => task.project_id === project.id)}
            />
          ))}
          {!projectList.length ? (
            <div className="card empty-state">
              <h2>No projects</h2>
              <p className="muted">Get started by creating a new project workspace.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
