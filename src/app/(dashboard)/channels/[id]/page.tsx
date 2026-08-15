import { notFound } from "next/navigation";
import type { Message } from "@/lib/types";
import { deleteMessage, editMessage, postChannelMessage, postThreadReply, toggleMessageReaction, uploadWorkspaceFile } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";
import { MessageRow } from "@/components/chat/message-row";

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
    <div className="chat-viewport">
      <header className="chat-viewport-header">
        <div>
          <h1>#{channel.slug}</h1>
          <p>{channel.description || "A focused place for project conversation, coordination, and updates."}</p>
        </div>
        <div className="badge-row">
          <span className="badge">{channel.type}</span>
          <span className="badge">{channel.is_private ? "Private" : "Open to workspace"}</span>
          <span className="badge">{(members ?? []).length} members</span>
        </div>
      </header>

      <div className="chat-scroll-area">
        <div className="message-list">
          {topLevelMessages.map((message) => {
            const threadReplies = messageList.filter((reply) => reply.parent_message_id === message.id);
            const groupedReactions = (reactions ?? []).filter((reaction: any) => reaction.message_id === message.id);

            // Group reactions
            const groupedReactionsMap = new Map<string, number>();
            groupedReactions.forEach((r: any) => {
              groupedReactionsMap.set(r.emoji, (groupedReactionsMap.get(r.emoji) || 0) + 1);
            });
            const groupedReactionsArray = Array.from(groupedReactionsMap.entries()).map(([emoji, count]) => ({ emoji, count }));

            return (
              <MessageRow
                key={message.id}
                message={message}
                senderName={messageMap.get(message.sender_user_id) || "Teammate"}
                channelId={channel.id}
                currentUserId={user.id}
                groupedReactions={groupedReactionsArray}
                threadReplies={threadReplies}
                replySendersMap={Object.fromEntries(messageMap)}
              />
            );
          })}

          {!topLevelMessages.length ? <p className="muted" style={{ padding: "0 24px" }}>No messages yet. Kick off the conversation below.</p> : null}
        </div>
      </div>

      <div className="chat-composer-area">
        <div className="chat-composer-box">
          <form action={postChannelMessage} style={{ margin: 0, display: "flex", flexDirection: "column" }}>
            <input type="hidden" name="channel_id" value={channel.id} />
            <textarea className="chat-composer-input" name="body" placeholder={`Message #${channel.slug}...`} required></textarea>
            
            <div className="chat-composer-toolbar">
              <div className="chat-composer-actions">
              </div>
              <button className="button primary small" type="submit" style={{ borderRadius: '6px' }}>
                Send
              </button>
            </div>
          </form>
        </div>
        
        <form action={uploadWorkspaceFile} className="inline-form" style={{ marginTop: "8px" }}>
          <input type="hidden" name="channel_id" value={channel.id} />
          <input type="hidden" name="scope" value="channel" />
          <input name="file" type="file" required style={{ fontSize: "12px", border: "none", padding: 0 }} />
          <button className="button small ghost" type="submit">
            Upload attachment
          </button>
        </form>
      </div>
    </div>
  );

}
