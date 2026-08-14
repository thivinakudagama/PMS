import type { ActivityEvent } from "@/lib/types";
import { requireModuleAccess } from "@/lib/current-org";

export default async function ActivityPage() {
  const { supabase, organizationId } = await requireModuleAccess("dashboard");

  const { data: events } = await supabase
    .from("activity_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const eventList = (events ?? []) as ActivityEvent[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Timeline</p>
          <h1>Activity</h1>
          <p className="muted">A running feed of project, task, file, and doc changes across the workspace.</p>
        </div>
      </section>

      <section className="card">
        <div className="timeline-list">
          {eventList.map((event) => (
            <article className="timeline-item" key={event.id}>
              <span className="timeline-dot" />
              <div>
                <strong>{event.title}</strong>
                <p className="muted">{event.detail || `${event.entity_type} · ${event.event_type}`}</p>
                <small>{new Date(event.created_at).toLocaleString()}</small>
              </div>
            </article>
          ))}

          {!eventList.length ? <p className="muted">Activity will appear here as your team starts collaborating.</p> : null}
        </div>
      </section>
    </div>
  );
}
