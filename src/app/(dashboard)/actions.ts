"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentOrg, requirePermission } from "@/lib/current-org";
import { ACTIONS, MODULES, type PermissionSet } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteDriveFile, ensureProjectDriveFolders, uploadFileToDrive } from "@/lib/google-drive";
import type { Priority, ProjectStatus, TaskStatus } from "@/lib/types";
import {
  normalizeEmail,
  validateEmail,
  validateFullName,
  validatePassword,
  validateProjectInput,
  validateRoleName
} from "@/lib/validation";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullable(value: string) {
  return value.length ? value : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function extractMentions(body: string) {
  const matches = body.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
  return [...new Set(matches.map((value) => value.slice(1).toLowerCase()))];
}

function parsePermissions(formData: FormData): PermissionSet {
  const permissions: PermissionSet = {};

  for (const moduleName of MODULES) {
    const values = formData.getAll(`perm_${moduleName}`).map(String);
    permissions[moduleName] = ACTIONS.filter((action) => values.includes(action));
  }

  return permissions;
}

async function logActivity(
  supabase: any,
  payload: {
    organization_id: string;
    actor_user_id?: string | null;
    project_id?: string | null;
    task_id?: string | null;
    channel_id?: string | null;
    entity_type: string;
    event_type: string;
    title: string;
    detail?: string | null;
  }
) {
  {
      const { error } = await supabase.from("activity_events").insert(payload);
      if (error) return redirectWithError(error.message);
    }
}

async function notifyUsers(
  supabase: any,
  organizationId: string,
  userIds: string[],
  payload: {
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
  }
) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return;

  {
      const { error } = await supabase.from("notifications").insert(
        uniqueIds.map((userId) => ({
          organization_id: organizationId,
          user_id: userId,
          type: payload.type,
          title: payload.title,
          body: payload.body ?? null,
          link: payload.link ?? null
        }))
      );
      if (error) return redirectWithError(error.message);
    }
}

async function getProjectChannels(supabase: any, projectId: string) {
  const { data } = await supabase.from("channels").select("id, slug, channel_kind").eq("project_id", projectId);
  return data ?? [];
}

async function addUsersToProjectChannels(supabase: any, organizationId: string, projectId: string, userIds: string[]) {
  const channels = await getProjectChannels(supabase, projectId);
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (!channels.length || !uniqueUserIds.length) return;

  {
      const { error } = await supabase.from("channel_members").upsert(
        channels.flatMap((channel: { id: string }) =>
          uniqueUserIds.map((userId) => ({
            organization_id: organizationId,
            channel_id: channel.id,
            user_id: userId
          }))
        ),
        { onConflict: "channel_id,user_id" }
      );
      if (error) return redirectWithError(error.message);
    }
}

async function removeUsersFromProjectChannels(supabase: any, projectId: string, userIds: string[]) {
  const channels = await getProjectChannels(supabase, projectId);
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!channels.length || !uniqueUserIds.length) return;

  await supabase
    .from("channel_members")
    .delete()
    .in("channel_id", channels.map((channel: { id: string }) => channel.id))
    .in("user_id", uniqueUserIds);
}

async function getProjectMemberOptions(supabase: any, organizationId: string, projectId: string) {
  const { data } = await supabase
    .from("project_members")
    .select("user_id, name, email")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .not("user_id", "is", null);

  return data ?? [];
}

async function resolveAssigneeNameForProjectMember(supabase: any, organizationId: string, projectId: string, userId: string) {
  const members = await getProjectMemberOptions(supabase, organizationId, projectId);
  const match = members.find((member: { user_id: string | null }) => member.user_id === userId);
  return match?.name ?? null;
}

async function assertProjectMemberAssignee(supabase: any, organizationId: string, projectId: string, assigneeUserId: string | null) {
  if (!assigneeUserId) return;

  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("user_id", assigneeUserId)
    .maybeSingle();

  if (!membership) {
    return redirectWithError("Tasks can only be assigned to project members.");
  }
}

async function createProjectChannelArtifacts(
  supabase: any,
  organizationId: string,
  userId: string,
  project: { id: string; name: string; description: string | null }
) {
  const slugBase = slugify(project.name) || `project-${project.id.slice(0, 8)}`;
  const { data: channel } = await supabase
    .from("channels")
    .insert({
      organization_id: organizationId,
      project_id: project.id,
      name: project.name,
      slug: slugBase,
      description: project.description ?? `Workspace for ${project.name}`,
      type: "project",
      channel_kind: "home",
      purpose: "home",
      is_private: true,
      is_default: true,
      created_by: userId
    })
    .select("*")
    .single();

  if (channel) {
    {
        const { error } = await supabase.from("channel_members").insert({
            organization_id: organizationId,
            channel_id: channel.id,
            user_id: userId
          });
        if (error) return redirectWithError(error.message);
      }

    {
        const { error } = await supabase.from("messages").insert({
            organization_id: organizationId,
            channel_id: channel.id,
            sender_user_id: userId,
            body: `Welcome to #${channel.slug}. This project channel is ready for status updates, task coordination, and decisions.`
          });
        if (error) return redirectWithError(error.message);
      }

    const subchannels = [
      { suffix: "updates", name: `${project.name} Updates`, purpose: "updates" },
      { suffix: "delivery", name: `${project.name} Delivery`, purpose: "delivery" },
      { suffix: "dev", name: `${project.name} Dev`, purpose: "dev" },
      { suffix: "qa", name: `${project.name} QA`, purpose: "qa" },
      { suffix: "files", name: `${project.name} Files`, purpose: "files" },
      { suffix: "support", name: `${project.name} Support`, purpose: "support" }
    ];

    for (const subchannel of subchannels) {
      const { data: createdSubchannel } = await supabase
        .from("channels")
        .insert({
          organization_id: organizationId,
          project_id: project.id,
          parent_channel_id: channel.id,
          name: subchannel.name,
          slug: `${slugBase}-${subchannel.suffix}`.slice(0, 90),
          description: `${subchannel.name} conversation space for ${project.name}.`,
          type: "project",
          channel_kind: "subchannel",
          purpose: subchannel.purpose,
          is_private: true,
          is_default: false,
          created_by: userId
        })
        .select("id")
        .single();

      if (createdSubchannel) {
        {
            const { error } = await supabase.from("channel_members").insert({
                    organization_id: organizationId,
                    channel_id: createdSubchannel.id,
                    user_id: userId
                  });
            if (error) return redirectWithError(error.message);
          }
      }
    }
  }

  {
      const { error } = await supabase.from("project_docs").upsert(
        {
          organization_id: organizationId,
          project_id: project.id,
          title: "Project overview",
          content_json: {
            text: `Project: ${project.name}\n\nGoals\n- \n\nMilestones\n- \n\nStakeholders\n- \n\nRisks\n- `
          },
          created_by: userId
        },
        { onConflict: "project_id,title" }
      );
      if (error) return redirectWithError(error.message);
    }

  {
      const { error } = await supabase.from("automations").insert([
        {
          organization_id: organizationId,
          project_id: project.id,
          name: "Post task status changes to channel",
          trigger_type: "task_status_changed",
          action_type: "post_message",
          created_by: userId,
          config: { audience: "project_channel" }
        },
        {
          organization_id: organizationId,
          project_id: project.id,
          name: "Daily overdue digest",
          trigger_type: "task_overdue_daily",
          action_type: "send_notification",
          created_by: userId,
          config: { audience: "project_members" }
        },
        {
          organization_id: organizationId,
          project_id: project.id,
          name: "Weekly project summary draft",
          trigger_type: "weekly_summary",
          action_type: "post_message",
          created_by: userId,
          config: { audience: "project_channel" }
        }
      ]);
      if (error) return redirectWithError(error.message);
    }

  {
      const { error } = await supabase.from("project_templates").upsert(
        [
          {
            organization_id: organizationId,
            name: "Sprint delivery",
            category: "Delivery",
            description: "Track sprint goals, blockers, and release readiness.",
            created_by: userId,
            template_data: { sections: ["Goals", "Backlog", "Risks", "Release notes"] }
          },
          {
            organization_id: organizationId,
            name: "Client delivery",
            category: "Client",
            description: "Coordinate scope, milestones, approvals, and launch tasks.",
            created_by: userId,
            template_data: { sections: ["Scope", "Milestones", "Approvals", "Launch plan"] }
          },
          {
            organization_id: organizationId,
            name: "Bug triage",
            category: "Engineering",
            description: "Handle incoming defects with ownership and severity tracking.",
            created_by: userId,
            template_data: { sections: ["Incoming bugs", "Severity", "Owner", "Fix verification"] }
          },
          {
            organization_id: organizationId,
            name: "Onboarding",
            category: "People",
            description: "Run IT onboarding with checklists, docs, and handoffs.",
            created_by: userId,
            template_data: { sections: ["Accounts", "Devices", "Introductions", "Training"] }
          },
          {
            organization_id: organizationId,
            name: "Incident response",
            category: "Operations",
            description: "Centralize response updates, owners, and postmortem work.",
            created_by: userId,
            template_data: { sections: ["Timeline", "Owners", "Mitigation", "Postmortem"] }
          }
        ],
        { onConflict: "organization_id,name" }
      );
      if (error) return redirectWithError(error.message);
    }

  return channel;
}

async function getProjectDefaultChannelId(supabase: any, projectId: string) {
  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("project_id", projectId)
    .eq("is_default", true)
    .maybeSingle();

  return channel?.id ?? null;
}

export async function createProject(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("projects", "create");

  const name = getString(formData, "name");
  const startDate = getString(formData, "start_date");
  const dueDate = getString(formData, "due_date");
  const budgetValue = getString(formData, "budget");
  const projectValidationError = validateProjectInput({
    name,
    startDate,
    dueDate,
    budget: budgetValue
  });

  if (projectValidationError) {
    redirect(`/projects?error=${encodeURIComponent(projectValidationError)}`);
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organizationId,
      owner_id: user.id,
      name,
      description: nullable(getString(formData, "description")),
      status: getString(formData, "status") as ProjectStatus,
      priority: getString(formData, "priority") as Priority,
      start_date: nullable(startDate),
      due_date: nullable(dueDate),
      budget: budgetValue ? Number(budgetValue) : null
    })
    .select("*")
    .single();

  if (error || !project) return redirectWithError(error?.message ?? "Unable to create project.");

  const channel = await createProjectChannelArtifacts(supabase, organizationId, user.id, project);

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: project.id,
    channel_id: channel?.id ?? null,
    entity_type: "project",
    event_type: "project_created",
    title: `Project created: ${project.name}`,
    detail: project.description
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/channels");
  revalidatePath("/activity");
  redirect(`/projects?message=${encodeURIComponent(`Project created: ${project.name}`)}`);
}

export async function updateProjectStatus(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("projects", "edit");

  const projectId = getString(formData, "project_id");
  const status = getString(formData, "status") as ProjectStatus;

  const { data: project, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .select("id, name")
    .single();
  if (error || !project) return redirectWithError(error?.message ?? "Unable to update project.");

  const channelId = await getProjectDefaultChannelId(supabase, projectId);

  if (channelId) {
    {
        const { error } = await supabase.from("messages").insert({
            organization_id: organizationId,
            channel_id: channelId,
            sender_user_id: user.id,
            body: `Project status updated to ${status}.`
          });
        if (error) return redirectWithError(error.message);
      }
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    channel_id: channelId,
    entity_type: "project",
    event_type: "project_status_changed",
    title: `${project.name} moved to ${status}`,
    detail: null
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
}

export async function deleteProject(formData: FormData) {
  const { supabase } = await requirePermission("projects", "delete");

  const projectId = getString(formData, "project_id");
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return redirectWithError(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/channels");
}

export async function createTask(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("tasks", "create");

  const projectId = getString(formData, "project_id");
  const assigneeUserId = nullable(getString(formData, "assignee_user_id"));
  await assertProjectMemberAssignee(supabase, organizationId, projectId, assigneeUserId);
  const assignee = assigneeUserId
    ? await resolveAssigneeNameForProjectMember(supabase, organizationId, projectId, assigneeUserId)
    : null;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      organization_id: organizationId,
      owner_id: user.id,
      project_id: projectId,
      title: getString(formData, "title"),
      description: nullable(getString(formData, "description")),
      status: getString(formData, "status") as TaskStatus,
      priority: getString(formData, "priority") as Priority,
      assignee_user_id: assigneeUserId,
      assignee,
      due_date: nullable(getString(formData, "due_date"))
    })
    .select("id, title, assignee_user_id, status")
    .single();

  if (error || !task) return redirectWithError(error?.message ?? "Unable to create task.");

  const channelId = await getProjectDefaultChannelId(supabase, projectId);
  if (channelId) {
    const { data: rootMessage } = await supabase
      .from("messages")
      .insert({
        organization_id: organizationId,
        channel_id: channelId,
        sender_user_id: user.id,
        body: `Task created: ${task.title}${assignee ? ` · Assigned to ${assignee}` : ""} · Status: ${task.status}`
      })
      .select("id")
      .single();

    if (rootMessage?.id) {
      {
          const { error } = await supabase.from("tasks").update({ discussion_message_id: rootMessage.id }).eq("id", task.id);
          if (error) return redirectWithError(error.message);
        }
    }
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    task_id: task.id,
    channel_id: channelId,
    entity_type: "task",
    event_type: "task_created",
    title: `Task created: ${task.title}`
  });

  if (task.assignee_user_id) {
    await notifyUsers(supabase, organizationId, [task.assignee_user_id], {
      type: "assignment",
      title: `You were assigned: ${task.title}`,
      body: "A new project task needs your attention.",
      link: `/projects/${projectId}?view=tasks`
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
  revalidatePath("/inbox");
}

export async function updateTask(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("tasks", "edit");

  const taskId = getString(formData, "task_id");
  const projectId = getString(formData, "project_id");
  const assigneeUserId = nullable(getString(formData, "assignee_user_id"));
  await assertProjectMemberAssignee(supabase, organizationId, projectId, assigneeUserId);
  const assignee = assigneeUserId
    ? await resolveAssigneeNameForProjectMember(supabase, organizationId, projectId, assigneeUserId)
    : null;

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      title: getString(formData, "title"),
      description: nullable(getString(formData, "description")),
      status: getString(formData, "status") as TaskStatus,
      priority: getString(formData, "priority") as Priority,
      assignee_user_id: assigneeUserId,
      assignee,
      due_date: nullable(getString(formData, "due_date"))
    })
    .eq("id", taskId)
    .select("id, title, assignee_user_id, discussion_message_id, status")
    .single();

  if (error || !task) return redirectWithError(error?.message ?? "Unable to update task.");

  const channelId = await getProjectDefaultChannelId(supabase, projectId);

  if (channelId) {
    {
        const { error } = await supabase.from("messages").insert({
            organization_id: organizationId,
            channel_id: channelId,
            sender_user_id: user.id,
            parent_message_id: task.discussion_message_id,
            body: `Task updated: ${task.title}${assignee ? ` · Assigned to ${assignee}` : ""} · Status: ${task.status}`
          });
        if (error) return redirectWithError(error.message);
      }
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    task_id: task.id,
    channel_id: channelId,
    entity_type: "task",
    event_type: "task_updated",
    title: `Task updated: ${task.title}`
  });

  if (task.assignee_user_id) {
    await notifyUsers(supabase, organizationId, [task.assignee_user_id], {
      type: "task_update",
      title: `${task.title} was updated`,
      body: "A project task assigned to you was updated.",
      link: `/projects/${projectId}?view=tasks`
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
  revalidatePath("/inbox");
}

export async function updateTaskStatus(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("tasks", "edit");

  const taskId = getString(formData, "task_id");
  const projectId = getString(formData, "project_id");
  const status = getString(formData, "status") as TaskStatus;

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select("id, title, assignee_user_id, discussion_message_id")
    .single();

  if (error || !task) return redirectWithError(error?.message ?? "Unable to update task status.");

  const channelId = await getProjectDefaultChannelId(supabase, projectId);
  if (channelId) {
    {
        const { error } = await supabase.from("messages").insert({
            organization_id: organizationId,
            channel_id: channelId,
            sender_user_id: user.id,
            parent_message_id: task.discussion_message_id,
            body: `Task "${task.title}" moved to ${status}.`
          });
        if (error) return redirectWithError(error.message);
      }
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    task_id: task.id,
    channel_id: channelId,
    entity_type: "task",
    event_type: "task_status_changed",
    title: `${task.title} moved to ${status}`
  });

  if (task.assignee_user_id) {
    await notifyUsers(supabase, organizationId, [task.assignee_user_id], {
      type: "task_update",
      title: `${task.title} is now ${status}`,
      link: `/projects/${projectId}?view=tasks`
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
  revalidatePath("/inbox");
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requirePermission("tasks", "delete");

  const taskId = getString(formData, "task_id");
  const projectId = getString(formData, "project_id");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return redirectWithError(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
}

export async function createProjectMember(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("team", "create");

  const projectId = getString(formData, "project_id");
  const memberUserId = getString(formData, "member_user_id");
  const { data: orgMember, error: memberLookupError } = await supabase
    .from("organization_members")
    .select("user_id, email, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .single();

  if (memberLookupError || !orgMember?.user_id) {
    return redirectWithError("Choose a valid staff member.");
  }

  // Guard: check if member is already in this project
  const { data: existingMembership } = await supabase
    .from("project_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (existingMembership) {
    redirect(`/projects/${projectId}?view=members&error=${encodeURIComponent("This member is already part of the project.")}`);
  }

  const profile = Array.isArray(orgMember.profiles) ? orgMember.profiles[0] : orgMember.profiles;
  const memberName = profile?.full_name || orgMember.email || "Teammate";

  const { error } = await supabase.from("project_members").insert({
    organization_id: organizationId,
    owner_id: user.id,
    project_id: projectId,
    user_id: orgMember.user_id,
    name: memberName,
    email: orgMember.email ?? null,
    role: nullable(getString(formData, "role"))
  });

  if (error) return redirectWithError(error.message);

  const channelId = await getProjectDefaultChannelId(supabase, projectId);
  if (orgMember.user_id) {
    await addUsersToProjectChannels(supabase, organizationId, projectId, [orgMember.user_id]);
    await notifyUsers(supabase, organizationId, [orgMember.user_id], {
      type: "project_update",
      title: "You were added to a project workspace",
      body: memberName,
      link: `/projects/${projectId}`
    });
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    channel_id: channelId,
    entity_type: "member",
    event_type: "project_member_added",
    title: `${memberName} joined the project`
  });

  revalidatePath("/team");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/channels");
  revalidatePath("/activity");
}

export async function removeProjectMember(formData: FormData) {
  const { supabase, organizationId } = await requirePermission("team", "edit");

  const projectMemberId = getString(formData, "project_member_id");
  const projectId = getString(formData, "project_id");

  const { data: member, error: memberError } = await supabase
    .from("project_members")
    .select("user_id, name")
    .eq("organization_id", organizationId)
    .eq("id", projectMemberId)
    .single();

  if (memberError || !member) return redirectWithError(memberError?.message ?? "Project member not found.");

  const { error } = await supabase.from("project_members").delete().eq("id", projectMemberId);
  if (error) return redirectWithError(error.message);

  if (member.user_id) {
    await removeUsersFromProjectChannels(supabase, projectId, [member.user_id]);
    await supabase
      .from("tasks")
      .update({ assignee_user_id: null, assignee: null })
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .eq("assignee_user_id", member.user_id);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/channels");
  revalidatePath("/tasks");
}

export async function createProjectChannel(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("channels", "create");

  const projectId = nullable(getString(formData, "project_id"));
  const name = getString(formData, "name");
  const slug = slugify(name);
  const purpose = nullable(getString(formData, "purpose"));

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      organization_id: organizationId,
      project_id: projectId,
      parent_channel_id: nullable(getString(formData, "parent_channel_id")),
      name,
      slug,
      description: nullable(getString(formData, "description")),
      type: projectId ? "project" : "workspace",
      channel_kind: projectId ? "subchannel" : "standard",
      purpose,
      is_private: getString(formData, "is_private") === "on",
      is_default: false,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error || !channel) return redirectWithError(error?.message ?? "Unable to create channel.");

  {
      const { error } = await supabase.from("channel_members").insert({
        organization_id: organizationId,
        channel_id: channel.id,
        user_id: user.id
      });
      if (error) return redirectWithError(error.message);
    }

  if (projectId) {
    const members = await getProjectMemberOptions(supabase, organizationId, projectId);
    await addUsersToProjectChannels(
      supabase,
      organizationId,
      projectId,
      members.map((member: { user_id: string | null }) => member.user_id).filter(Boolean)
    );
  }

  revalidatePath("/channels");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function postChannelMessage(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "create");

  const channelId = getString(formData, "channel_id");
  const body = getString(formData, "body");
  if (!body) return;

  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", channelId)
    .single();

  if (!channel) return redirectWithError("You do not have access to this channel.");

  const mentions = extractMentions(body);
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      organization_id: organizationId,
      channel_id: channelId,
      sender_user_id: user.id,
      body,
      mentions
    })
    .select("id")
    .single();

  if (error || !message) return redirectWithError(error?.message ?? "Unable to post message.");

  {
      const { error } = await supabase.from("channels").update({ updated_at: new Date().toISOString() }).eq("id", channelId);
      if (error) return redirectWithError(error.message);
    }

  const { data: mentionedMembers } = mentions.length
    ? await supabase
      .from("organization_members")
      .select("user_id, profiles(full_name), email")
      .eq("organization_id", organizationId)
    : { data: [] };

  const mentionTargets =
    mentionedMembers
      ?.filter((member: any) => {
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        return mentions.includes((profile?.full_name ?? member.email ?? "").toLowerCase().replace(/\s+/g, "."));
      })
      .map((member: any) => member.user_id) ?? [];

  await notifyUsers(supabase, organizationId, mentionTargets, {
    type: "mention",
    title: "You were mentioned in a channel",
    body,
    link: `/channels/${channelId}`
  });

  revalidatePath(`/channels/${channelId}`);
  revalidatePath("/channels");
  revalidatePath("/inbox");
}

export async function editMessage(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "edit");

  const messageId = getString(formData, "message_id");
  const body = getString(formData, "body");
  const channelId = nullable(getString(formData, "channel_id"));
  const conversationId = nullable(getString(formData, "conversation_id"));
  if (!body) return;

  const { error } = await supabase
    .from("messages")
    .update({ body, mentions: extractMentions(body), updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("organization_id", organizationId)
    .eq("sender_user_id", user.id);

  if (error) return redirectWithError(error.message);

  if (channelId) revalidatePath(`/channels/${channelId}`);
  if (conversationId) revalidatePath(`/direct-messages/${conversationId}`);
}

export async function deleteMessage(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "delete");
  const messageId = getString(formData, "message_id");
  const channelId = nullable(getString(formData, "channel_id"));
  const conversationId = nullable(getString(formData, "conversation_id"));

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("organization_id", organizationId)
    .eq("sender_user_id", user.id);
  if (error) return redirectWithError(error.message);

  if (channelId) revalidatePath(`/channels/${channelId}`);
  if (conversationId) revalidatePath(`/direct-messages/${conversationId}`);
  revalidatePath("/channels");
  revalidatePath("/direct-messages");
}

export async function postThreadReply(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "create");

  const parentMessageId = getString(formData, "parent_message_id");
  const channelId = nullable(getString(formData, "channel_id"));
  const conversationId = nullable(getString(formData, "conversation_id"));
  const body = getString(formData, "body");
  if (!body) return;

  const { data: parent } = await supabase
    .from("messages")
    .select("sender_user_id, channel_id, conversation_id")
    .eq("organization_id", organizationId)
    .eq("id", parentMessageId)
    .single();

  if (!parent) return redirectWithError("Thread not found.");
  if ((parent.channel_id ?? null) !== channelId || (parent.conversation_id ?? null) !== conversationId) {
    return redirectWithError("This reply does not belong to the selected conversation.");
  }

  const { error } = await supabase.from("messages").insert({
    organization_id: organizationId,
    channel_id: channelId,
    conversation_id: conversationId,
    parent_message_id: parentMessageId,
    sender_user_id: user.id,
    body,
    mentions: extractMentions(body)
  });

  if (error) return redirectWithError(error.message);

  if (channelId) {
    {
        const { error } = await supabase.from("channels").update({ updated_at: new Date().toISOString() }).eq("id", channelId);
        if (error) return redirectWithError(error.message);
      }
  }

  if (conversationId) {
    {
        const { error } = await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
        if (error) return redirectWithError(error.message);
      }
  }

  if (parent?.sender_user_id && parent.sender_user_id !== user.id) {
    await notifyUsers(supabase, organizationId, [parent.sender_user_id], {
      type: "reply",
      title: "Someone replied to your thread",
      body,
      link: channelId ? `/channels/${channelId}` : `/direct-messages/${conversationId}`
    });
  }

  if (channelId) revalidatePath(`/channels/${channelId}`);
  if (conversationId) revalidatePath(`/direct-messages/${conversationId}`);
  revalidatePath("/inbox");
}

export async function toggleMessageReaction(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "create");

  const messageId = getString(formData, "message_id");
  const emoji = getString(formData, "emoji");
  const channelId = nullable(getString(formData, "channel_id"));
  const conversationId = nullable(getString(formData, "conversation_id"));
  const { data: message } = await supabase
    .from("messages")
    .select("id, channel_id, conversation_id")
    .eq("organization_id", organizationId)
    .eq("id", messageId)
    .single();

  if (!message) return redirectWithError("Message not found.");
  if ((message.channel_id ?? null) !== channelId || (message.conversation_id ?? null) !== conversationId) {
    return redirectWithError("This reaction does not belong to the selected conversation.");
  }

  const existing = await supabase
    .from("message_reactions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing.data?.id) {
    {
        const { error } = await supabase.from("message_reactions").delete().eq("id", existing.data.id);
        if (error) return redirectWithError(error.message);
      }
  } else {
    {
        const { error } = await supabase.from("message_reactions").insert({
            organization_id: organizationId,
            message_id: messageId,
            user_id: user.id,
            emoji
          });
        if (error) return redirectWithError(error.message);
      }
  }

  if (channelId) revalidatePath(`/channels/${channelId}`);
  if (conversationId) revalidatePath(`/direct-messages/${conversationId}`);
  revalidatePath(channelId ? "/channels" : "/direct-messages");
}

export async function startDirectMessage(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "create");

  const teammateId = getString(formData, "teammate_user_id");
  if (teammateId === user.id) return redirectWithError("Choose a teammate to start a direct message.");

  const { data: teammate } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", teammateId)
    .maybeSingle();

  if (!teammate) return redirectWithError("That teammate is not part of this workspace.");

  const { data: existingMemberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id")
    .eq("organization_id", organizationId)
    .in("user_id", [user.id, teammateId]);

  const candidateCounts = new Map<string, Set<string>>();
  (existingMemberships ?? []).forEach((membership: { conversation_id: string; user_id: string }) => {
    const set = candidateCounts.get(membership.conversation_id) ?? new Set<string>();
    set.add(membership.user_id);
    candidateCounts.set(membership.conversation_id, set);
  });

  const candidateConversationIds = [...candidateCounts.entries()]
    .filter(([, members]) => members.has(user.id) && members.has(teammateId))
    .map(([conversationId]) => conversationId);

  if (candidateConversationIds.length) {
    const { data: fullMemberships } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .eq("organization_id", organizationId)
      .in("conversation_id", candidateConversationIds);

    const fullCounts = new Map<string, Set<string>>();
    (fullMemberships ?? []).forEach((membership: { conversation_id: string; user_id: string }) => {
      const set = fullCounts.get(membership.conversation_id) ?? new Set<string>();
      set.add(membership.user_id);
      fullCounts.set(membership.conversation_id, set);
    });

    for (const [conversationId, members] of fullCounts.entries()) {
      if (members.has(user.id) && members.has(teammateId) && members.size === 2) {
        revalidatePath("/direct-messages");
        redirect(`/direct-messages/${conversationId}`);
      }
    }
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: organizationId,
      type: "direct",
      created_by: user.id
    })
    .select("id")
    .single();

  if (error || !conversation) return redirectWithError(error?.message ?? "Unable to start conversation.");

  {
      const { error } = await supabase.from("conversation_members").insert([
        { organization_id: organizationId, conversation_id: conversation.id, user_id: user.id },
        { organization_id: organizationId, conversation_id: conversation.id, user_id: teammateId }
      ]);
      if (error) return redirectWithError(error.message);
    }

  revalidatePath("/direct-messages");
  redirect(`/direct-messages/${conversation.id}`);
}

export async function postDirectMessage(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("messages", "create");

  const conversationId = getString(formData, "conversation_id");
  const body = getString(formData, "body");
  if (!body) return;

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return redirectWithError("You do not have access to this conversation.");

  const { error } = await supabase.from("messages").insert({
    organization_id: organizationId,
    conversation_id: conversationId,
    sender_user_id: user.id,
    body,
    mentions: extractMentions(body)
  });

  if (error) return redirectWithError(error.message);

  {
      const { error } = await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      if (error) return redirectWithError(error.message);
    }

  const { data: members } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id);

  await notifyUsers(
    supabase,
    organizationId,
    (members ?? []).map((member: { user_id: string }) => member.user_id),
    {
      type: "reply",
      title: "New direct message",
      body,
      link: `/direct-messages/${conversationId}`
    }
  );

  revalidatePath(`/direct-messages/${conversationId}`);
  revalidatePath("/direct-messages");
  revalidatePath("/inbox");
}

export async function saveProjectDoc(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("docs", "edit");

  const projectId = getString(formData, "project_id");
  const title = getString(formData, "title") || "Project overview";
  const content = getString(formData, "content");

  const { error } = await supabase.from("project_docs").upsert(
    {
      organization_id: organizationId,
      project_id: projectId,
      title,
      content_json: { text: content },
      created_by: user.id
    },
    { onConflict: "project_id,title" }
  );

  if (error) return redirectWithError(error.message);

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    entity_type: "doc",
    event_type: "doc_updated",
    title: `${title} updated`
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
}

export async function addTaskComment(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("tasks", "create");

  const taskId = getString(formData, "task_id");
  const projectId = getString(formData, "project_id");
  const body = getString(formData, "body");
  if (!body) return;

  const { error } = await supabase.from("task_comments").insert({
    organization_id: organizationId,
    task_id: taskId,
    user_id: user.id,
    body
  });

  if (error) return redirectWithError(error.message);

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    project_id: projectId,
    task_id: taskId,
    entity_type: "task",
    event_type: "task_comment_added",
    title: "Task comment added",
    detail: body
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/activity");
}

export async function uploadWorkspaceFile(formData: FormData) {
  const { supabase, user, organizationId } = await requirePermission("files", "create");

  const rawFile = formData.get("file");
  if (!(rawFile instanceof File) || !rawFile.size) {
    return redirectWithError("Choose a file to upload.");
  }

  // Check if Google Drive is configured before attempting upload
  const hasDriveConfig =
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
    process.env.GOOGLE_DRIVE_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!hasDriveConfig) {
    redirect("/files?error=" + encodeURIComponent("File uploads require Google Drive configuration. Please contact your administrator to set up GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID."));
  }

  const projectId = nullable(getString(formData, "project_id"));
  const taskId = nullable(getString(formData, "task_id"));
  const channelId = nullable(getString(formData, "channel_id"));
  const messageId = nullable(getString(formData, "message_id"));
  const scope = getString(formData, "scope") || (projectId ? "project" : "workspace");
  const { organizationName } = await getCurrentOrg();
  const { data: project } = projectId
    ? await supabase.from("projects").select("name").eq("id", projectId).maybeSingle()
    : { data: null };

  let driveFile: Awaited<ReturnType<typeof uploadFileToDrive>>;
  let folders: Awaited<ReturnType<typeof ensureProjectDriveFolders>>;
  try {
    folders = await ensureProjectDriveFolders(organizationName, project?.name ?? null, scope);
    driveFile = await uploadFileToDrive({
      file: rawFile,
      folderId: folders.scopeFolder.id,
      fileName: rawFile.name
    });
  } catch (driveErr: unknown) {
    const message = driveErr instanceof Error ? driveErr.message : "Unable to upload to Google Drive.";
    redirect("/files?error=" + encodeURIComponent(message));
  }

  const { error } = await supabase.from("files").insert({
    organization_id: organizationId,
    project_id: projectId,
    task_id: taskId,
    channel_id: channelId,
    message_id: messageId,
    uploaded_by: user.id,
    bucket_name: null,
    storage_path: null,
    storage_provider: "google_drive",
    drive_file_id: driveFile!.id,
    drive_folder_id: folders!.scopeFolder.id,
    drive_web_view_link: driveFile!.webViewLink ?? null,
    drive_download_link: driveFile!.webContentLink ?? null,
    file_name: rawFile.name,
    content_type: rawFile.type || null,
    size_bytes: rawFile.size,
    scope
  });

  if (error) return redirectWithError(error.message);

  revalidatePath("/files");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  if (channelId) revalidatePath(`/channels/${channelId}`);
}

export async function deleteWorkspaceFile(formData: FormData) {
  const { supabase, organizationId } = await requirePermission("files", "delete");

  const fileId = getString(formData, "file_id");
  const { data: file, error: lookupError } = await supabase
    .from("files")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", fileId)
    .single();

  if (lookupError || !file) return redirectWithError(lookupError?.message ?? "File not found.");

  if (file.storage_provider === "google_drive" && file.drive_file_id) {
    await deleteDriveFile(file.drive_file_id);
  }

  if (file.storage_provider === "supabase" && file.bucket_name && file.storage_path) {
    await supabase.storage.from(file.bucket_name).remove([file.storage_path]);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) return redirectWithError(error.message);

  revalidatePath("/files");
  if (file.project_id) revalidatePath(`/projects/${file.project_id}`);
  if (file.channel_id) revalidatePath(`/channels/${file.channel_id}`);
}

export async function markNotificationRead(formData: FormData) {
  const { supabase, user } = await getCurrentOrg();

  const notificationId = getString(formData, "notification_id");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return redirectWithError(error.message);

  revalidatePath("/inbox");
}

export async function createRole(formData: FormData) {
  const { supabase, organizationId, user } = await requirePermission("roles", "create");
  const name = getString(formData, "name");
  const roleNameError = validateRoleName(name);

  if (roleNameError) {
    redirect(`/roles?error=${encodeURIComponent(roleNameError)}`);
  }

  const { error } = await supabase.from("roles").insert({
    organization_id: organizationId,
    name,
    description: nullable(getString(formData, "description")),
    permissions: parsePermissions(formData)
  });

  if (error) {
    redirect(`/roles?error=${encodeURIComponent(error.message)}`);
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "role_created",
    title: `Role created: ${name}`,
    detail: nullable(getString(formData, "description"))
  });

  revalidatePath("/roles");
  revalidatePath("/activity");
  redirect(`/roles?message=${encodeURIComponent(`Role created: ${name}`)}`);
}

export async function updateRole(formData: FormData) {
  const { supabase, organizationId, user } = await requirePermission("roles", "edit");
  const roleId = getString(formData, "role_id");
  const name = getString(formData, "name");
  const roleNameError = validateRoleName(name);

  if (roleNameError) {
    redirect(`/roles?error=${encodeURIComponent(roleNameError)}`);
  }

  const { data: existingRole } = await supabase
    .from("roles")
    .select("name")
    .eq("organization_id", organizationId)
    .eq("id", roleId)
    .maybeSingle();

  const { error } = await supabase
    .from("roles")
    .update({
      name,
      description: nullable(getString(formData, "description")),
      permissions: parsePermissions(formData)
    })
    .eq("organization_id", organizationId)
    .eq("id", roleId)
    .eq("is_system", false);

  if (error) {
    redirect(`/roles?error=${encodeURIComponent(error.message)}`);
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "role_updated",
    title: `Role updated: ${name}`,
    detail: existingRole?.name && existingRole.name !== name ? `Previously ${existingRole.name}` : null
  });

  revalidatePath("/roles");
  revalidatePath("/activity");
  redirect(`/roles?message=${encodeURIComponent(`Role updated: ${name}`)}`);
}

export async function deleteRole(formData: FormData) {
  const { supabase, organizationId, user } = await requirePermission("roles", "delete");

  const roleId = getString(formData, "role_id");
  const { data: existingRole } = await supabase
    .from("roles")
    .select("name")
    .eq("organization_id", organizationId)
    .eq("id", roleId)
    .maybeSingle();

  const { error } = await supabase.from("roles").delete().eq("id", roleId).eq("is_system", false);
  if (error) {
    redirect(`/roles?error=${encodeURIComponent(error.message)}`);
  }

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "role_deleted",
    title: `Role deleted: ${existingRole?.name ?? "Unknown role"}`
  });

  revalidatePath("/roles");
  revalidatePath("/activity");
  redirect(`/roles?message=${encodeURIComponent(`Role deleted: ${existingRole?.name ?? "Unknown role"}`)}`);
}

export async function createStaffAccount(formData: FormData) {
  const { user, organizationId } = await requirePermission("team", "create");

  const fullName = getString(formData, "full_name");
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");
  const roleId = nullable(getString(formData, "role_id"));
  const fullNameError = validateFullName(fullName);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (fullNameError || emailError || passwordError) {
    redirect(`/team?error=${encodeURIComponent(fullNameError ?? emailError ?? passwordError ?? "Invalid input.")}`);
  }

  const adminSupabase = createAdminClient();

  const { data: existingProfile, error: existingProfileError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    redirect(`/team?error=${encodeURIComponent(existingProfileError.message)}`);
  }

  if (existingProfile) {
    redirect("/team?error=An account with this email already exists.");
  }

  const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      created_by_admin: true,
      created_by_user_id: user.id
    }
  });

  if (createUserError || !createdUser.user) {
    redirect(`/team?error=${encodeURIComponent(createUserError?.message ?? "Unable to create the staff account.")}`);
  }

  const staffUserId = createdUser.user.id;

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({
      full_name: fullName,
      email
    })
    .eq("id", staffUserId);

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(staffUserId);
    redirect(`/team?error=${encodeURIComponent(profileError.message)}`);
  }

  const { error: cleanupError } = await adminSupabase.from("organizations").delete().eq("owner_id", staffUserId);

  if (cleanupError) {
    await adminSupabase.auth.admin.deleteUser(staffUserId);
    redirect(`/team?error=${encodeURIComponent(cleanupError.message)}`);
  }

  const { error: memberError } = await adminSupabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: staffUserId,
    email,
    role_id: roleId,
    is_admin: false,
    permissions_override: null
  });

  if (memberError) {
    await adminSupabase.auth.admin.deleteUser(staffUserId);
    redirect(`/team?error=${encodeURIComponent(memberError.message)}`);
  }

  await logActivity(adminSupabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "member_created",
    title: `Staff account created: ${fullName}`,
    detail: email
  });

  revalidatePath("/team");
  revalidatePath("/roles");
  revalidatePath("/activity");
  redirect(`/team?message=${encodeURIComponent(`Staff account created for ${fullName}.`)}`);
}

export async function updateProfilePermissions(formData: FormData) {
  const { supabase, organizationId, user } = await requirePermission("team", "edit");

  const memberId = getString(formData, "member_id");
  const roleId = nullable(getString(formData, "role_id"));
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("email, role_id, roles(name), profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .maybeSingle();

  const { error } = await supabase
    .from("organization_members")
    .update({ role_id: roleId })
    .eq("id", memberId)
    .eq("is_admin", false);

  if (error) {
    redirect(`/team?error=${encodeURIComponent(error.message)}`);
  }

  const { data: nextRole } = roleId
    ? await supabase.from("roles").select("name").eq("organization_id", organizationId).eq("id", roleId).maybeSingle()
    : { data: null as { name?: string } | null };
  const profile = Array.isArray(existingMember?.profiles) ? existingMember?.profiles[0] : existingMember?.profiles;
  const previousRole = Array.isArray(existingMember?.roles) ? existingMember?.roles[0] : existingMember?.roles;
  const memberName = profile?.full_name || existingMember?.email || "Staff member";

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "member_role_updated",
    title: `Role updated for ${memberName}`,
    detail: `${previousRole?.name ?? "No role"} -> ${nextRole?.name ?? "No role"}`
  });

  revalidatePath("/team");
  revalidatePath("/roles");
  revalidatePath("/activity");
  redirect(`/team?message=${encodeURIComponent(`Updated role for ${memberName}.`)}`);
}

export async function resetStaffPassword(formData: FormData) {
  const { user, organizationId, supabase } = await requirePermission("team", "edit");
  const memberUserId = getString(formData, "member_user_id");
  const password = getString(formData, "password");
  const passwordError = validatePassword(password);

  if (passwordError) {
    redirect(`/team?error=${encodeURIComponent(passwordError)}`);
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.auth.admin.updateUserById(memberUserId, {
    password,
    user_metadata: {
      password_reset_by_admin: true,
      password_reset_by_user_id: user.id
    }
  });

  if (error) {
    redirect(`/team?error=${encodeURIComponent(error.message)}`);
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("email, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("user_id", memberUserId)
    .maybeSingle();
  const profile = Array.isArray(member?.profiles) ? member?.profiles[0] : member?.profiles;
  const memberName = profile?.full_name || member?.email || "Staff member";

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "member_password_reset",
    title: `Password reset for ${memberName}`
  });

  revalidatePath("/team");
  revalidatePath("/activity");
  redirect(`/team?message=${encodeURIComponent(`Password updated for ${memberName}.`)}`);
}

export async function editStaffMember(formData: FormData) {
  const { user, organizationId, supabase } = await requirePermission("team", "edit");

  const memberId = getString(formData, "member_id");
  const fullName = getString(formData, "full_name");
  const email = normalizeEmail(getString(formData, "email"));
  const fullNameError = validateFullName(fullName);
  const emailError = validateEmail(email);

  if (fullNameError || emailError) {
    redirect(`/team?error=${encodeURIComponent(fullNameError ?? emailError ?? "Invalid input.")}`);
  }

  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("user_id, email, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .maybeSingle();

  if (!existingMember) {
    redirect(`/team?error=${encodeURIComponent("Member not found.")}`);
  }

  // Check if email is already taken by another member
  if (email !== existingMember.email) {
    const { data: emailExists } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .maybeSingle();

    if (emailExists) {
      redirect(`/team?error=${encodeURIComponent("Email is already in use.")}`);
    }
  }

  const adminSupabase = createAdminClient();

  // Update auth user email
  const { error: updateAuthError } = await adminSupabase.auth.admin.updateUserById(existingMember.user_id, {
    email
  });

  if (updateAuthError) {
    redirect(`/team?error=${encodeURIComponent(updateAuthError.message)}`);
  }

  // Update profile
  const { error: updateProfileError } = await adminSupabase
    .from("profiles")
    .update({ full_name: fullName, email })
    .eq("id", existingMember.user_id);

  if (updateProfileError) {
    redirect(`/team?error=${encodeURIComponent(updateProfileError.message)}`);
  }

  // Update organization_members
  const { error: updateMemberError } = await supabase
    .from("organization_members")
    .update({ email })
    .eq("id", memberId);

  if (updateMemberError) {
    redirect(`/team?error=${encodeURIComponent(updateMemberError.message)}`);
  }

  // Sync full_name to all project_members records for this user
  await supabase
    .from("project_members")
    .update({ name: fullName, email })
    .eq("organization_id", organizationId)
    .eq("user_id", existingMember.user_id);

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "member_updated",
    title: `Member updated: ${fullName}`,
    detail: `Email: ${email}`
  });

  revalidatePath("/team");
  revalidatePath("/activity");
  redirect(`/team?message=${encodeURIComponent(`Updated member ${fullName}.`)}`);
}

export async function deleteStaffMember(formData: FormData) {
  const { user, organizationId, supabase } = await requirePermission("team", "edit");

  const memberId = getString(formData, "member_id");

  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id, email, is_admin, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    redirect(`/team?error=${encodeURIComponent("Member not found.")}`);
  }

  if (member.is_admin) {
    redirect(`/team?error=${encodeURIComponent("Cannot delete administrator accounts.")}`);
  }

  const adminSupabase = createAdminClient();

  // Delete auth user
  const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(member.user_id);

  if (deleteAuthError) {
    redirect(`/team?error=${encodeURIComponent(deleteAuthError.message)}`);
  }

  // Remove the organization_members row (auth cascade may not cover this)
  await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", member.user_id);

  const profile = Array.isArray(member?.profiles) ? member?.profiles[0] : member?.profiles;
  const memberName = profile?.full_name || member?.email || "Staff member";

  await logActivity(supabase, {
    organization_id: organizationId,
    actor_user_id: user.id,
    entity_type: "member",
    event_type: "member_deleted",
    title: `Member deleted: ${memberName}`,
    detail: member.email
  });

  revalidatePath("/team");
  revalidatePath("/activity");
  redirect(`/team?message=${encodeURIComponent(`Deleted member ${memberName}.`)}`);
}

export async function refreshInvites() {
  const { supabase } = await getCurrentOrg();
  await supabase.rpc("accept_pending_invitations");
  revalidatePath("/dashboard");
}

export async function switchWorkspace(formData: FormData) {
  const cookieStore = await cookies();
  const { supabase, user } = await getCurrentOrg();
  const selectedOrganizationId = getString(formData, "organization_id");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", selectedOrganizationId)
    .maybeSingle();

  if (!membership) {
    redirect("/settings?error=You do not have access to that workspace.");
  }

  cookieStore.set("active-org-id", selectedOrganizationId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax"
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?message=Workspace switched successfully.");
}

async function redirectWithError(message: string, fallbackPath: string = "/dashboard"): Promise<never> {

      const headersList = await headers();
      const referer = headersList.get("referer");
      let redirectPath = fallbackPath;
      if (referer) {
        try {
          const url = new URL(referer);
          url.searchParams.set("error", message);
          redirectPath = url.pathname + url.search;
        } catch (e) {
          // Ignore
        }
      } else {
        redirectPath = `${fallbackPath}?error=${encodeURIComponent(message)}`;
      }
      redirect(redirectPath);
          
}
