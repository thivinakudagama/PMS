import { notFound } from "next/navigation";
import type { Message } from "@/lib/types";
import { deleteMessage, editMessage, postChannelMessage, postThreadReply, toggleMessageReaction, uploadWorkspaceFile } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";

export default async function ChannelDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, organizationId } = await requireModuleAccess("channels");

  const [{ data: channel }, { data: messages }, { data: members }] = await Promise.all([
    supabase.from("channels").select("*").eq("organization_id", organizationId).eq("id", id).single(),
    supabase.from("messages").select("*").eq("organization_id", organizationId).eq("channel_id", id).order("created_at"),
    supabase.from("channel_members").select("user_id").eq("organization_id", organizationId).eq("channel_id", id)
  ]);

  if (!channel) notFound();

  // Scope profiles to channel members only to prevent full DB scan
  const memberUserIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberUserIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberUserIds)
    : { data: [] };

  // Scope reactions to only messages in this channel
  const messageList = (messages ?? []) as Message[];
  const messageIds = messageList.map((m) => m.id);
  const { data: reactions } = messageIds.length
    ? await supabase.from("message_reactions").select("*").eq("organization_id", organizationId).in("message_id", messageIds)
    : { data: [] };
  const messageMap = new Map((profiles ?? []).map((profile: { id: string; full_name: string | null }) => [profile.id, profile.full_name || "Teammate"]));
  const topLevelMessages = messageList.filter((message) => !message.parent_message_id);

  return (
    <div className="page-stack">
      <section className="project-hero">
        <div>
          <p className="eyebrow">Channel</p>
          <h1>#{channel.slug}</h1>
          <p>{channel.description || "A focused place for project conversation, coordination, and updates."}</p>
          <div className="badge-row">
            <span className="badge">{channel.type}</span>
            <span className="badge">{channel.is_private ? "Private" : "Open to workspace"}</span>
            <span className="badge">{(members ?? []).length} members</span>
          </div>
        </div>
      </section>

      <section className="conversation-layout">
        <div className="card conversation-card">
          <div className="message-list">
            {topLevelMessages.map((message) => {
              const threadReplies = messageList.filter((reply) => reply.parent_message_id === message.id);
              const groupedReactions = (reactions ?? []).filter((reaction: any) => reaction.message_id === message.id);

              return (
                <article className="message-card" id={`message-${message.id}`} key={message.id}>
                  <div className="card-header">
                    <div>
                      <strong>{messageMap.get(message.sender_user_id) || "Teammate"}</strong>
                      <p className="muted">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                    <div className="row-end">
                      {["👍", "🔥", "✅"].map((emoji) => (
                        <form action={toggleMessageReaction} key={emoji}>
                          <input type="hidden" name="message_id" value={message.id} />
                          <input type="hidden" name="channel_id" value={channel.id} />
                          <input type="hidden" name="emoji" value={emoji} />
                          <button className="button small" type="submit">
                            {emoji} {groupedReactions.filter((reaction: any) => reaction.emoji === emoji).length || ""}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>

                  <p>{message.body}</p>

                  {message.sender_user_id === user.id ? (
                    <form action={editMessage} className="inline-form message-edit-form">
                      <input type="hidden" name="message_id" value={message.id} />
                      <input type="hidden" name="channel_id" value={channel.id} />
                      <input name="body" defaultValue={message.body} aria-label="Edit message" />
                      <button className="button small" type="submit">
                        Save
                      </button>
                    </form>
                  ) : null}

                  <div className="thread-list">
                    {threadReplies.map((reply) => (
                      <div className="thread-item" key={reply.id}>
                        <strong>{messageMap.get(reply.sender_user_id) || "Teammate"}</strong>
                        <p className="muted">{reply.body}</p>
                      </div>
                    ))}
                  </div>

                  {message.sender_user_id === user.id ? (
                    <form action={deleteMessage}>
                      <input type="hidden" name="message_id" value={message.id} />
                      <input type="hidden" name="channel_id" value={channel.id} />
                      <button className="button danger small" type="submit">
                        Delete
                      </button>
                    </form>
                  ) : null}

                  <form action={postThreadReply} className="inline-form">
                    <input type="hidden" name="parent_message_id" value={message.id} />
                    <input type="hidden" name="channel_id" value={channel.id} />
                    <input name="body" placeholder="Reply in thread..." />
                    <button className="button small" type="submit">
                      Reply
                    </button>
                  </form>
                </article>
              );
            })}

            {!topLevelMessages.length ? <p className="muted">No messages yet. Kick off the conversation below.</p> : null}
          </div>
        </div>

        <div className="page-stack">
          <form action={postChannelMessage} className="card form-card">
            <h2>New message</h2>
            <input type="hidden" name="channel_id" value={channel.id} />
            <textarea name="body" rows={4} placeholder="Share an update, decision, or blocker..." required />
            <button className="button primary" type="submit">
              Send
            </button>
          </form>

          <form action={uploadWorkspaceFile} className="card form-card">
            <h2>Attach file</h2>
            <input type="hidden" name="channel_id" value={channel.id} />
            <input type="hidden" name="scope" value="channel" />
            <input name="file" type="file" required />
            <button className="button" type="submit">
              Upload file
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
