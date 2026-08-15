"use client";

import { useState, useEffect, useRef } from "react";
import { deleteMessage, editMessage, postThreadReply, toggleMessageReaction } from "@/app/(dashboard)/actions";

export function MessageRow({
  message,
  senderName,
  channelId,
  conversationId,
  currentUserId,
  groupedReactions,
  threadReplies,
  replySendersMap
}: {
  message: any;
  senderName: string;
  channelId?: string;
  conversationId?: string;
  currentUserId: string;
  groupedReactions: any[];
  threadReplies: any[];
  replySendersMap: Record<string, string>;
}) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    }
    if (menuPos) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuPos]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  function handleReact(emoji: string) {
    const formData = new FormData();
    formData.append("message_id", message.id);
    if (channelId) formData.append("channel_id", channelId);
    if (conversationId) formData.append("conversation_id", conversationId);
    formData.append("emoji", emoji);
    toggleMessageReaction(formData);
    setMenuPos(null);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this message?")) {
      const formData = new FormData();
      formData.append("message_id", message.id);
      if (channelId) formData.append("channel_id", channelId);
      if (conversationId) formData.append("conversation_id", conversationId);
      deleteMessage(formData);
    }
    setMenuPos(null);
  }

  const avatarLetter = senderName ? senderName[0].toUpperCase() : "T";
  const timeString = new Date(message.created_at).toLocaleString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <article className="chat-message-row" id={`message-${message.id}`} onContextMenu={handleContextMenu}>
      <div className="chat-avatar large" style={{ width: "42px", height: "42px", fontSize: "1.2rem", borderRadius: "8px" }}>
        {avatarLetter}
      </div>

      <div className="chat-content">
        <div className="chat-meta">
          <strong style={{ fontSize: "15px" }}>{senderName}</strong>
          <small>{timeString}</small>
        </div>

        <div className="chat-bubble">
          <p style={{ margin: 0, fontSize: "15px" }}>{message.body}</p>
        </div>

        {groupedReactions.length > 0 && (
          <div className="chat-reactions-display" style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            {groupedReactions.map((emojiGroup, idx) => (
              <span key={idx} className="badge" style={{ cursor: 'pointer', padding: '2px 6px' }} onClick={() => handleReact(emojiGroup.emoji)}>
                {emojiGroup.emoji} {emojiGroup.count}
              </span>
            ))}
          </div>
        )}

        {isEditing && (
          <form
            action={(formData) => {
              editMessage(formData);
              setIsEditing(false);
            }}
            className="inline-form message-edit-form"
            style={{ marginTop: "8px" }}
          >
            <input type="hidden" name="message_id" value={message.id} />
            {channelId && <input type="hidden" name="channel_id" value={channelId} />}
            {conversationId && <input type="hidden" name="conversation_id" value={conversationId} />}
            <input name="body" defaultValue={message.body} aria-label="Edit message" autoFocus />
            <button className="button small ghost" type="submit">
              Save
            </button>
            <button className="button small ghost" type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </form>
        )}

        {threadReplies.length > 0 && (
          <div className="chat-bubble-threads">
            {threadReplies.map((reply) => (
              <div className="chat-thread-item" key={reply.id}>
                <strong>{replySendersMap[reply.sender_user_id] || "Teammate"}</strong>
                <p style={{ margin: 0 }}>{reply.body}</p>
              </div>
            ))}
          </div>
        )}

        {isReplying && (
          <form
            action={(formData) => {
              postThreadReply(formData);
              setIsReplying(false);
            }}
            className="inline-form"
            style={{ marginTop: "8px" }}
          >
            <input type="hidden" name="parent_message_id" value={message.id} />
            {channelId && <input type="hidden" name="channel_id" value={channelId} />}
            {conversationId && <input type="hidden" name="conversation_id" value={conversationId} />}
            <input name="body" placeholder="Reply in thread..." autoFocus />
            <button className="button small ghost" type="submit">
              Reply
            </button>
            <button className="button small ghost" type="button" onClick={() => setIsReplying(false)}>
              Cancel
            </button>
          </form>
        )}
      </div>

      {menuPos && (
        <div
          ref={menuRef}
          className="custom-context-menu"
          style={{
            position: "fixed",
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 1000,
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            padding: "8px 0",
            minWidth: "160px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: 'flex', gap: '8px', padding: '0 12px 8px 12px', borderBottom: '1px solid var(--border)' }}>
            <button type="button" className="context-menu-emoji" onClick={() => handleReact("👍")}>👍</button>
            <button type="button" className="context-menu-emoji" onClick={() => handleReact("✅")}>✅</button>
            <button type="button" className="context-menu-emoji" onClick={() => handleReact("🔥")}>🔥</button>
            <button type="button" className="context-menu-emoji" onClick={() => handleReact("👀")}>👀</button>
          </div>
          <button type="button" className="context-menu-item" onClick={() => { setIsReplying(true); setMenuPos(null); }}>
            Reply in Thread
          </button>
          {message.sender_user_id === currentUserId && (
            <>
              <button type="button" className="context-menu-item" onClick={() => { setIsEditing(true); setMenuPos(null); }}>
                Edit Message
              </button>
              <button type="button" className="context-menu-item danger" onClick={handleDelete} style={{ color: 'var(--error)' }}>
                Delete Message
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
