import Link from "next/link";
import type { Notification } from "@/lib/types";
import { requireModuleAccess } from "@/lib/current-org";
import { markNotificationRead } from "@/app/(dashboard)/actions";

export default async function InboxPage() {
  const { supabase, user, organizationId } = await requireModuleAccess("notifications");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (notifications ?? []) as Notification[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Stay in the loop</p>
          <h1>Inbox</h1>
          <p className="muted">Mentions, assignments, replies, and project alerts in one place.</p>
        </div>
      </section>

      <section className="card">
        <div className="list-stack">
          {items.map((notification) => (
            <article className={`notification-row ${notification.is_read ? "is-read" : ""}`} key={notification.id}>
              <div>
                <strong>{notification.title}</strong>
                <p className="muted">{notification.body || "No extra details."}</p>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>

              <div className="row-end">
                {notification.link ? (
                  <Link className="button small" href={notification.link}>
                    Open
                  </Link>
                ) : null}

                {!notification.is_read ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notification_id" value={notification.id} />
                    <button className="button ghost small" type="submit">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}

          {!items.length ? <p className="muted">No unread surprises. Your inbox is clear.</p> : null}
        </div>
      </section>
    </div>
  );
}
