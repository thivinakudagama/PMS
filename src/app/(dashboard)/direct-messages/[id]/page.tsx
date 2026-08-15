import { notFound } from "next/navigation";
import type { Message } from "@/lib/types";
import { deleteMessage, editMessage, postDirectMessage, postThreadReply } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";
import { MessageRow } from "@/components/chat/message-row";

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
  const messageIds = messageList.map((m) => m.id);
  const { data: reactions } = messageIds.length
    ? await supabase.from("message_reactions").select("*").eq("organization_id", organizationId).in("message_id", messageIds)
    : { data: [] };



  return (
    <div className="chat-viewport">
      <header className="chat-viewport-header">
        <div>
          <h1>{conversation.title || members.join(", ") || "Conversation"}</h1>
          <p>Private coordination for quick decisions, follow-ups, and asynchronous updates.</p>
        </div>
      </header>

      <div className="chat-scroll-area">
        <div className="message-list">
          {messageList.filter((message) => !message.parent_message_id).map((message) => {
              const threadReplies = messageList.filter((reply) => reply.parent_message_id === message.id);
              const groupedReactions = (reactions ?? []).filter((reaction: any) => reaction.message_id === message.id);
              
              const groupedReactionsMap = new Map<string, number>();
              groupedReactions.forEach((r: any) => {
                groupedReactionsMap.set(r.emoji, (groupedReactionsMap.get(r.emoji) || 0) + 1);
              });
              const groupedReactionsArray = Array.from(groupedReactionsMap.entries()).map(([emoji, count]) => ({ emoji, count }));

              return (
                <MessageRow
                  key={message.id}
                  message={message}
                  senderName={profileMap.get(message.sender_user_id) || "Teammate"}
                  conversationId={conversation.id}
                  currentUserId={user.id}
                  groupedReactions={groupedReactionsArray}
                  threadReplies={threadReplies}
                  replySendersMap={Object.fromEntries(profileMap)}
                />
              );
          })}
          
          {!messageList.length ? <p className="muted" style={{ padding: "0 24px" }}>No messages yet. Send one below.</p> : null}
        </div>
      </div>

      <div className="chat-composer-area">
        <div className="chat-composer-box">
          <form action={postDirectMessage} style={{ margin: 0, display: "flex", flexDirection: "column" }}>
            <input type="hidden" name="conversation_id" value={conversation.id} />
            <textarea className="chat-composer-input" name="body" placeholder="Write a direct message..." required></textarea>
            
            <div className="chat-composer-toolbar">
              <div className="chat-composer-actions">
              </div>
              <button className="button primary small" type="submit" style={{ borderRadius: '6px' }}>
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

}
