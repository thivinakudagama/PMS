import Link from "next/link";
import { startDirectMessage } from "@/app/(dashboard)/actions";
import { getCurrentOrg } from "@/lib/current-org";

export default async function DirectMessagesPage() {
  const { supabase, user, organizationId } = await getCurrentOrg();

  // Fetch teammates first, then scope profiles to known user IDs
  const { data: teammates } = await supabase
    .from("organization_members")
    .select("user_id, email")
    .eq("organization_id", organizationId)
    .neq("user_id", user.id);

  const teammateUserIds = (teammates ?? []).map((t: { user_id: string }) => t.user_id);

  // Scope to only conversations the current user is a member of
  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id);

  const myConversationIds = (myMemberships ?? []).map((m: { conversation_id: string }) => m.conversation_id);

  const [{ data: memberships }, { data: conversations }, { data: messages }, { data: profiles }] = await Promise.all([
    myConversationIds.length
      ? supabase.from("conversation_members").select("conversation_id, user_id").eq("organization_id", organizationId).in("conversation_id", myConversationIds)
      : Promise.resolve({ data: [] }),
    myConversationIds.length
      ? supabase.from("conversations").select("*").eq("organization_id", organizationId).in("id", myConversationIds).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    myConversationIds.length
      ? supabase.from("messages").select("id, conversation_id, body, parent_message_id, created_at").eq("organization_id", organizationId).in("conversation_id", myConversationIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    // Scope profiles to org members only — prevents full DB scan
    teammateUserIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", [...new Set([user.id, ...teammateUserIds])])
      : supabase.from("profiles").select("id, full_name").eq("id", user.id)
  ]);

  const profileMap = new Map((profiles ?? []).map((profile: { id: string; full_name: string | null }) => [profile.id, profile.full_name || "Teammate"]));

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Quick coordination</p>
          <h1>Direct Messages</h1>
          <p className="muted">Start a one-to-one conversation without leaving the workspace.</p>
        </div>
      </section>

      <section className="split-layout">
        <div className="card">
          <h2>Start a direct message</h2>
          <div className="list-stack">
            {(teammates ?? []).map((teammate: { user_id: string; email: string | null }) => (
              <form action={startDirectMessage} className="list-row" key={teammate.user_id}>
                <input type="hidden" name="teammate_user_id" value={teammate.user_id} />
                <div>
                  <strong>{profileMap.get(teammate.user_id) || teammate.email || "Teammate"}</strong>
                  <p className="muted">{teammate.email || "No email"}</p>
                </div>
                <button className="button small" type="submit">
                  Message
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Existing conversations</h2>
          <div className="list-stack">
            {(conversations ?? []).map((conversation: { id: string; title: string | null }) => {
              const memberIds =
                (memberships ?? [])
                  .filter((membership: { conversation_id: string; user_id: string }) => membership.conversation_id === conversation.id)
                  .map((membership: { user_id: string }) => membership.user_id)
                  .filter((memberId: string) => memberId !== user.id) ?? [];
              const names = memberIds.map((memberId: string) => profileMap.get(memberId) || "Teammate");
              const latest = (messages ?? []).find((message: any) => message.conversation_id === conversation.id && !message.parent_message_id);

              return (
                <Link className="list-row" href={`/direct-messages/${conversation.id}`} key={conversation.id}>
                  <div>
                    <strong>{conversation.title || names.join(", ") || "Direct message"}</strong>
                    <p className="muted">{latest?.body || "No messages yet."}</p>
                  </div>
                  <span>{latest ? new Date(latest.created_at).toLocaleDateString() : "New"}</span>
                </Link>
              );
            })}

            {!conversations?.length ? <p className="muted">No conversations started yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
