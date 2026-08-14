import Link from "next/link";
import type { Channel, Project, ProjectDoc, Task, WorkspaceFile, Message } from "@/lib/types";
import { requireModuleAccess } from "@/lib/current-org";
import { can } from "@/lib/rbac";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const { supabase, membership, organizationId, user } = await requireModuleAccess("search");

  let projectsQuery = supabase.from("projects").select("*").eq("organization_id", organizationId).ilike("name", `%${query}%`).limit(8);
  let tasksQuery = supabase.from("tasks").select("*").eq("organization_id", organizationId).or(`title.ilike.%${query}%,description.ilike.%${query}%`).limit(8);
  let docsQuery = supabase.from("project_docs").select("*").eq("organization_id", organizationId).ilike("title", `%${query}%`).limit(8);
  let filesQuery = supabase.from("files").select("*").eq("organization_id", organizationId).ilike("file_name", `%${query}%`).limit(8);
  let channelsQuery = supabase.from("channels").select("*").eq("organization_id", organizationId).or(`name.ilike.%${query}%,slug.ilike.%${query}%`).limit(8);
  let messagesQuery = supabase.from("messages").select("*").eq("organization_id", organizationId).ilike("body", `%${query}%`).limit(8);

  // RBAC Scoping Logic
  if (!can(membership, "projects", "view_global")) {
    const { data: myMemberships } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
    const myProjectIds = (myMemberships ?? []).map((m: any) => m.project_id);
    if (myProjectIds.length > 0) {
      projectsQuery = projectsQuery.or(`owner_id.eq.${user.id},id.in.(${myProjectIds.join(",")})`);
    } else {
      projectsQuery = projectsQuery.eq("owner_id", user.id);
    }
  }

  if (!can(membership, "tasks", "view_global")) {
    tasksQuery = tasksQuery.or(`owner_id.eq.${user.id},assignee_user_id.eq.${user.id}`);
  }

  if (!can(membership, "docs", "view_global")) {
    docsQuery = docsQuery.eq("created_by", user.id);
  }

  if (!can(membership, "files", "view_global")) {
    filesQuery = filesQuery.eq("uploaded_by", user.id);
  }

  if (!can(membership, "channels", "view_global")) {
    const { data: myMemberships } = await supabase.from("channel_members").select("channel_id").eq("user_id", user.id);
    const myChannelIds = (myMemberships ?? []).map((m: any) => m.channel_id);
    if (myChannelIds.length > 0) {
      channelsQuery = channelsQuery.or(`created_by.eq.${user.id},id.in.(${myChannelIds.join(",")})`);
    } else {
      channelsQuery = channelsQuery.eq("created_by", user.id);
    }
  }

  if (!can(membership, "messages", "view_global")) {
    messagesQuery = messagesQuery.eq("sender_user_id", user.id);
  }

  const [projects, tasks, docs, files, channels, messages] = query
    ? await Promise.all([
        projectsQuery,
        tasksQuery,
        docsQuery,
        filesQuery,
        channelsQuery,
        messagesQuery
      ])
    : [null, null, null, null, null, null];

  const sections = [
    {
      title: "Projects",
      items: ((projects?.data ?? []) as Project[]).map((item) => ({
        id: item.id,
        href: `/projects/${item.id}`,
        title: item.name,
        body: item.description || "Project"
      }))
    },
    {
      title: "Tasks",
      items: ((tasks?.data ?? []) as Task[]).map((item) => ({
        id: item.id,
        href: `/projects/${item.project_id}?view=tasks`,
        title: item.title,
        body: item.description || item.status
      }))
    },
    {
      title: "Docs",
      items: ((docs?.data ?? []) as ProjectDoc[]).map((item) => ({
        id: item.id,
        href: `/projects/${item.project_id}?view=docs`,
        title: item.title,
        body: item.content_json?.text?.slice(0, 120) || "Project document"
      }))
    },
    {
      title: "Files",
      items: ((files?.data ?? []) as WorkspaceFile[]).map((item) => ({
        id: item.id,
        href: item.project_id ? `/projects/${item.project_id}?view=files` : "/files",
        title: item.file_name,
        body: item.scope
      }))
    },
    {
      title: "Channels",
      items: ((channels?.data ?? []) as Channel[]).map((item) => ({
        id: item.id,
        href: `/channels/${item.id}`,
        title: `#${item.slug}`,
        body: item.description || "Channel"
      }))
    },
    {
      title: "Messages",
      items: ((messages?.data ?? []) as Message[]).map((item) => ({
        id: item.id,
        href: item.channel_id ? `/channels/${item.channel_id}` : "/direct-messages",
        title: "Message match",
        body: item.body
      }))
    }
  ];

  const hasResults = sections.some((s) => s.items.length > 0);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Find anything</p>
          <h1>Search</h1>
          <p className="muted">Search across your authorized projects, tasks, channels, docs, and files.</p>
        </div>
      </section>

      <div className="card">
        <form className="list-row" method="get" action="/search" style={{ border: "none" }}>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search the workspace..."
            autoFocus
            style={{ flex: 1, padding: "0.75rem", fontSize: "1.1rem" }}
          />
          <button type="submit" className="button primary">
            Search
          </button>
        </form>
      </div>

      {!query ? (
        <div className="card empty-state">
          <h2>Global search</h2>
          <p className="muted">Enter a keyword to search across the workspace.</p>
        </div>
      ) : hasResults ? (
        <div className="split-layout">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <div key={section.title} className="card">
                <h2>{section.title}</h2>
                <div className="list-stack">
                  {section.items.map((item) => (
                    <div className="list-row" key={item.id}>
                      <span>
                        <strong>
                          <Link href={item.href}>{item.title}</Link>
                        </strong>
                        <p className="muted">{item.body.length > 100 ? item.body.slice(0, 100) + "..." : item.body}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="card empty-state">
          <h2>No results</h2>
          <p className="muted">No matches found for &quot;{query}&quot;.</p>
        </div>
      )}
    </div>
  );
}
