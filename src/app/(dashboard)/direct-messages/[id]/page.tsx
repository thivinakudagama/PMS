import { notFound } from "next/navigation";
import type { Message } from "@/lib/types";
import { deleteMessage, editMessage, postDirectMessage, postThreadReply } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";

export default async function DirectMessageDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, organizationId } = await requireModuleAccess("messages");

  const [{ data: conversation }, { data: messages }, { data: memberships }] = await Promise.all([
    supabase.from("conversations").select("*").eq("organization_id", organizationId).eq("id", id).maybeSingle(),
    supabase.from("messages").select("*").eq("organization_id", organizationId).eq("conversation_id", id).order("created_at"),
    supabase.from("conversation_members").select("user_id").eq("organization_id", organizationId).eq("conversation_id", id)
  ]);

  if (!conversation) notFound();

  // Verify the current user is actually a member of this conversation
  const { data: userMembership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userMembership) notFound();

  // Scope profiles to only users in this conversation
  const memberUserIds = (memberships ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberUserIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberUserIds)
    : { data: [] };


  const profileMap = new Map((profiles ?? []).map((profile: { id: string; full_name: string | null }) => [profile.id, profile.full_name || "Teammate"]));
  const members = (memberships ?? []).map((membership: { user_id: string }) => profileMap.get(membership.user_id) || "Teammate");
  const messageList = (messages ?? []) as Message[];

  return (
    <div className="page-stack">
      <section className="project-hero">
        <div>
          <p className="eyebrow">Direct message</p>
          <h1>{conversation.title || members.join(", ") || "Conversation"}</h1>
          <p>Private coordination for quick decisions, follow-ups, and asynchronous updates.</p>
        </div>
      </section>

      <section className="conversation-layout">
        <div className="card conversation-card">
          <div className="message-list">
            {messageList.filter((message) => !message.parent_message_id).map((message) => (
              <article className={`chat-message-row ${message.sender_user_id === user.id ? 'is-me' : ''}`} key={message.id}>
                {message.sender_user_id !== user.id && (
                  <div className="chat-avatar">
                    {(profileMap.get(message.sender_user_id) || "T")[0].toUpperCase()}
                  </div>
                )}
                
                <div className="chat-content">
                  {message.sender_user_id !== user.id && (
                    <div className="chat-meta">
                      <strong>{profileMap.get(message.sender_user_id) || "Teammate"}</strong>
                      <small>{new Date(message.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  )}

                  <div className="chat-bubble">
                    <p>{message.body}</p>
                  </div>

                  <div className="chat-actions">
                    {message.sender_user_id === user.id ? (
                      <form action={deleteMessage}>
                        <input type="hidden" name="message_id" value={message.id} />
                        <input type="hidden" name="conversation_id" value={conversation.id} />
                        <button className="button danger small ghost" type="submit" style={{ padding: "0.2rem 0.5rem" }}>
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </div>

                  {message.sender_user_id === user.id ? (
                    <form action={editMessage} className="inline-form message-edit-form" style={{ marginTop: "8px" }}>
                      <input type="hidden" name="message_id" value={message.id} />
                      <input type="hidden" name="conversation_id" value={conversation.id} />
                      <input name="body" defaultValue={message.body} aria-label="Edit message" />
                      <button className="button small ghost" type="submit">
                        Save
                      </button>
                    </form>
                  ) : null}

                  {messageList.filter((reply) => reply.parent_message_id === message.id).length > 0 && (
                    <div className="chat-bubble-threads">
                      {messageList
                        .filter((reply) => reply.parent_message_id === message.id)
                        .map((reply) => (
                          <div className="chat-thread-item" key={reply.id}>
                            <strong>{profileMap.get(reply.sender_user_id) || "Teammate"}</strong>
                            <p>{reply.body}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  <form action={postThreadReply} className="inline-form" style={{ marginTop: "8px" }}>
                    <input type="hidden" name="parent_message_id" value={message.id} />
                    <input type="hidden" name="conversation_id" value={conversation.id} />
                    <input name="body" placeholder="Reply in thread..." />
                    <button className="button small ghost" type="submit">
                      Reply
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form action={postDirectMessage} className="card form-card">
          <h2>Message</h2>
          <input type="hidden" name="conversation_id" value={conversation.id} />
          <textarea name="body" rows={5} placeholder="Write your message..." required />
          <button className="button primary" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
