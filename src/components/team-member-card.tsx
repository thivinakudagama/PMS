"use client";

import { useState, useRef } from "react";
import { updateProfilePermissions, resetStaffPassword, editStaffMember, deleteStaffMember } from "@/app/(dashboard)/actions";
import { can, resolveRole } from "@/lib/rbac";

type TeamMemberCardProps = {
  member: {
    id: string;
    email: string | null;
    is_admin: boolean;
    user_id: string;
    role_id: string | null;
    profiles?: {
      full_name: string | null;
    } | null;
    roles?: {
      id: string;
      name: string;
    } | null;
  };
  membership: any;
  roleList: Array<{ id: string; name: string }>;
};

export function TeamMemberCard({ member, membership, roleList }: TeamMemberCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
  const role = member.is_admin ? "Administrator" : resolveRole(member as any)?.name ?? "No role";
  const isEditable = can(membership, "team", "edit") && !member.is_admin;

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await editStaffMember(formData);
  };

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await deleteStaffMember(formData);
  };

  return (
    <>
      <article className="card team-card">
        <div className="card-header">
          <span className="avatar large">{(profile?.full_name || member.email || "S").charAt(0).toUpperCase()}</span>
          {isEditable && (
            <div className="card-actions">
              <button type="button" className="icon-button" title="Edit user" onClick={() => setEditOpen(true)}>
                ✎
              </button>
              <button type="button" className="icon-button danger" title="Delete user" onClick={() => setDeleteOpen(true)}>
                🗑
              </button>
            </div>
          )}
        </div>

        <h3>{profile?.full_name || member.email}</h3>
        <p className="muted">{role}</p>
        <p>{member.email || "No email"}</p>

        {isEditable ? (
          <>
            <form action={updateProfilePermissions} className="form-stack">
              <input type="hidden" name="member_id" value={member.id} />
              <select name="role_id" defaultValue={member.role_id ?? ""}>
                <option value="">No role</option>
                {roleList.map((roleItem) => (
                  <option value={roleItem.id} key={roleItem.id}>
                    {roleItem.name}
                  </option>
                ))}
              </select>
              <button className="button small" type="submit">
                Update role
              </button>
            </form>

            <form action={resetStaffPassword} className="form-stack">
              <input type="hidden" name="member_user_id" value={member.user_id} />
              <input name="password" type="password" minLength={8} placeholder="New temp password" required />
              <button className="button ghost small" type="submit">
                Reset password
              </button>
            </form>
          </>
        ) : null}
      </article>

      {/* Edit Modal */}
      {isEditable && (
        <dialog
          open={editOpen}
          className="modal"
          onClose={() => setEditOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="modal-content">
            <h2>Edit User</h2>
            <form ref={editFormRef} onSubmit={handleEditSubmit} className="form-stack">
              <input type="hidden" name="member_id" value={member.id} />
              <label>
                Full name
                <input name="full_name" type="text" defaultValue={profile?.full_name || ""} required />
              </label>
              <label>
                Email
                <input name="email" type="email" defaultValue={member.email || ""} required />
              </label>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button className="button primary" type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Delete Modal */}
      {isEditable && (
        <dialog
          open={deleteOpen}
          className="modal"
          onClose={() => setDeleteOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteOpen(false);
          }}
        >
          <div className="modal-content danger">
            <h2>Delete User</h2>
            <p>
              Are you sure you want to delete <strong>{profile?.full_name || member.email}</strong>? This action cannot be undone.
            </p>
            <form ref={deleteFormRef} onSubmit={handleDeleteSubmit} className="form-stack">
              <input type="hidden" name="member_id" value={member.id} />
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </button>
                <button className="button danger" type="submit">
                  Delete User
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
