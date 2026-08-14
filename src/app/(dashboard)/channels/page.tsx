import Link from "next/link";
import type { Channel, Message } from "@/lib/types";
import { createProjectChannel } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";
import { can } from "@/lib/rbac";

type ChannelWithProject = Channel & {
  projects?: {
    name: string;
  } | null;
};

export default async function ChannelsPage() {
  const { supabase, membership, organizationId, user } = await requireModuleAccess("channels");

  const canViewGlobalChannels = can(membership, "channels", "view_global");
  let channelsQuery = supabase.from("channels").select("*, projects(name)").eq("organization_id", organizationId).order("updated_at", { ascending: false });

  if (!canViewGlobalChannels) {
    const { data: myMemberships } = await supabase.from("channel_members").select("channel_id").eq("user_id", user.id);
    const myChannelIds = (myMemberships ?? []).map((m: any) => m.channel_id);
    if (myChannelIds.length > 0) {
      channelsQuery = channelsQuery.or(`created_by.eq.${user.id},id.in.(${myChannelIds.join(",")})`);
    } else {
      channelsQuery = channelsQuery.eq("created_by", user.id);
    }
  }

  const [{ data: channels }, { data: projects }, { data: messages }] = await Promise.all([
    channelsQuery,
    supabase.from("projects").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("messages").select("id, channel_id, body, parent_message_id, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100)
  ]);

  const channelList = (channels ?? []) as ChannelWithProject[];
  const latestMessages = (messages ?? []) as Message[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Conversations</p>
          <h1>Channels</h1>
          <p className="muted">Project channels and shared rooms for planning, delivery, and support.</p>
        </div>
      </section>

      <section className="split-layout">
        {can(membership, "channels", "create") ? (
          <form action={createProjectChannel} className="card form-card">
            <div>
              <h2>Create channel</h2>
              <p className="muted">Add a project-specific subchannel or a general collaboration channel.</p>
            </div>

            <label>
              Channel name
              <input name="name" placeholder="qa-war-room" required />
            </label>

            <label>
              Description
              <textarea name="description" rows={3} placeholder="What should this channel be used for?" />
            </label>

            <label>
              Link to project
              <select name="project_id" defaultValue="">
                <option value="">General channel</option>
                {(projects ?? []).map((project: { id: string; name: string }) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Purpose
              <select name="purpose" defaultValue="updates">
                <option value="updates">Updates</option>
                <option value="delivery">Delivery</option>
                <option value="dev">Dev</option>
                <option value="qa">QA</option>
                <option value="files">Files</option>
                <option value="support">Support</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="checkbox-label">
              <input name="is_private" type="checkbox" />
              Private channel
            </label>

            <button className="button primary" type="submit">
              Create channel
            </button>
          </form>
        ) : (
          <div className="card empty-state">
            <h2>View-only access</h2>
            <p className="muted">Your role does not allow creating channels.</p>
          </div>
        )}

        <div className="page-stack">
          <div className="card">
            <div className="card-header">
              <h2>Project channel spaces</h2>
              <span>{channelList.length} channels</span>
            </div>
            <div className="list-stack">
              {channelList.map((channel) => {
                const lastMessage = latestMessages.find((message) => message.channel_id === channel.id && !message.parent_message_id);

                return (
                  <Link className="list-row" href={`/channels/${channel.id}`} key={channel.id}>
                    <div>
                      <strong>#{channel.slug}</strong>
                      <p className="muted">
                        {channel.projects?.name || "General"} · {channel.channel_kind} · {channel.purpose || channel.type}
                      </p>
                    </div>
                    <div className="row-end">
                      <span className="badge">{channel.is_private ? "Private" : "Open"}</span>
                      <span>{lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : "No messages"}</span>
                    </div>
                  </Link>
                );
              })}

              {!channelList.length ? <p className="muted">No channels yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
