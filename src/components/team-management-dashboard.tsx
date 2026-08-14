"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Settings,
  Shield,
  User,
  Trash2,
  UserCheck,
  ShieldAlert
} from "lucide-react";
import {
  updateProfilePermissions,
  resetStaffPassword,
  editStaffMember,
  deleteStaffMember,
  createStaffAccount
} from "@/app/(dashboard)/actions";
import { can, resolveRole } from "@/lib/rbac";

type StaffMember = {
  id: string;
  email: string | null;
  is_admin: boolean;
  user_id: string;
  role_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
  roles?: {
    id: string;
    name: string;
  } | null;
};

type Role = {
  id: string;
  name: string;
};

type TeamManagementDashboardProps = {
  members: StaffMember[];
  roles: Role[];
  membership: any;
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 40%)`;
};

export function TeamManagementDashboard({
  members,
  roles,
  membership
}: TeamManagementDashboardProps) {
  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [sortKey, setSortKey] = useState("name_asc");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  // Tabs within the Manage Modal: 'profile' | 'role' | 'password' | 'danger'
  const [activeTab, setActiveTab] = useState<'profile' | 'role' | 'password' | 'danger'>('profile');

  // Stats calculation
  const totalUsers = members.length;
  const adminCount = members.filter((m) => m.is_admin).length;
  const assignedRolesCount = new Set(members.filter((m) => m.role_id).map((m) => m.role_id)).size;

  // Filtered and sorted members
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    // Apply Search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((member) => {
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        const name = profile?.full_name?.toLowerCase() || "";
        const email = member.email?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
      });
    }

    // Apply Role Filter
    if (selectedRoleFilter !== "") {
      result = result.filter((member) => {
        if (selectedRoleFilter === "admin") {
          return member.is_admin;
        }
        return member.role_id === selectedRoleFilter;
      });
    }

    // Apply Sorting
    result.sort((a, b) => {
      const aProfile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      const bProfile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      const aName = aProfile?.full_name || a.email || "";
      const bName = bProfile?.full_name || b.email || "";
      
      switch (sortKey) {
        case "name_asc":
          return aName.localeCompare(bName);
        case "name_desc":
          return bName.localeCompare(aName);
        case "joined_newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "joined_oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [members, searchQuery, selectedRoleFilter, sortKey]);

  const canCreate = can(membership, "team", "create");
  const canEdit = can(membership, "team", "edit");

  // Format joined date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleOpenManageModal = (member: StaffMember) => {
    setSelectedMember(member);
    setActiveTab('profile');
    setManageOpen(true);
  };

  // Get profile data helper
  const getMemberProfile = (member: StaffMember) => {
    return Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
  };

  const selectedMemberProfile = selectedMember ? getMemberProfile(selectedMember) : null;
  const selectedMemberRoleName = selectedMember
    ? selectedMember.is_admin
      ? "Administrator"
      : resolveRole(selectedMember as any)?.name ?? "No role"
    : "";

  return (
    <div className="team-dashboard-wrapper">
      {/* Stats Summary Cards */}
      <section className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Total Users</p>
              <h2>{totalUsers}</h2>
            </div>
            <div className="stat-icon">
              <User size={20} />
            </div>
          </div>
          <p className="stat-note">Active accounts in this workspace</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Administrators</p>
              <h2>{adminCount}</h2>
            </div>
            <div className="stat-icon" style={{ background: "rgba(220, 38, 38, 0.08)", color: "var(--danger)" }}>
              <Shield size={20} />
            </div>
          </div>
          <p className="stat-note">Users with full workspace access</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Active Roles</p>
              <h2>{assignedRolesCount}</h2>
            </div>
            <div className="stat-icon" style={{ background: "rgba(22, 163, 74, 0.08)", color: "var(--success)" }}>
              <UserCheck size={20} />
            </div>
          </div>
          <p className="stat-note">Distinct roles currently assigned</p>
        </div>
      </section>

      {/* Toolbar / Filters */}
      <div className="card toolbar-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div className="toolbar-layout" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Search Box */}
          <div className="search-input-wrapper" style={{ position: "relative", flex: "1", minWidth: "260px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex", alignItems: "center" }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "42px", minHeight: "42px", margin: "0" }}
            />
          </div>

          {/* Filters and Action */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            
            {/* Filter by Role */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                style={{ minHeight: "42px", width: "160px", margin: "0", fontSize: "14px" }}
              >
                <option value="">All Roles</option>
                <option value="admin">Administrators</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                style={{ minHeight: "42px", width: "180px", margin: "0", fontSize: "14px" }}
              >
                <option value="name_asc">Name (A - Z)</option>
                <option value="name_desc">Name (Z - A)</option>
                <option value="joined_newest">Joined (Newest First)</option>
                <option value="joined_oldest">Joined (Oldest First)</option>
              </select>
            </div>

            {/* Create Button */}
            {canCreate && (
              <button
                type="button"
                className="button primary"
                onClick={() => setCreateOpen(true)}
                style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "0.5rem", margin: "0" }}
              >
                <Plus size={16} />
                Create User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List / Table */}
      <section className="card" style={{ padding: "0", overflow: "hidden" }}>
        {filteredAndSortedMembers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="table desktop-only" style={{ width: "100%", borderCollapse: "collapse" }}>
              <div className="table-row table-head" style={{ gridTemplateColumns: "1.8fr 1.2fr 1fr 0.6fr", padding: "0.85rem 1.5rem" }}>
                <span>User</span>
                <span>Role</span>
                <span>Joined Date</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {filteredAndSortedMembers.map((member) => {
                const profile = getMemberProfile(member);
                const name = profile?.full_name || member.email || "Unnamed Member";
                const roleName = member.is_admin
                  ? "Administrator"
                  : resolveRole(member as any)?.name ?? "No Role";

                return (
                  <div
                    className="table-row"
                    key={member.id}
                    style={{
                      gridTemplateColumns: "1.8fr 1.2fr 1fr 0.6fr",
                      padding: "0.95rem 1.5rem",
                      transition: "background 150ms ease"
                    }}
                  >
                    {/* User Details */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                      <span
                        className="avatar"
                        style={{
                          background: getAvatarColor(name),
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "700",
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ fontSize: "14.5px" }}>{name}</strong>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{member.email}</span>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div>
                      <span
                        className={`badge ${
                          member.is_admin
                            ? "cancelled" // matches red/danger soft color
                            : member.role_id
                            ? "priority-medium" // matches blue/purple soft color
                            : "not-started"
                        }`}
                        style={{ fontSize: "11px", padding: "0.22rem 0.6rem" }}
                      >
                        {roleName}
                      </span>
                    </div>

                    {/* Joined Date */}
                    <div style={{ fontSize: "13.5px", color: "var(--muted-strong)" }}>
                      {formatDate(member.created_at)}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {canEdit && !member.is_admin ? (
                        <button
                          type="button"
                          className="button ghost small"
                          onClick={() => handleOpenManageModal(member)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.35rem 0.7rem",
                            minHeight: "30px"
                          }}
                        >
                          <Settings size={14} />
                          Manage
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>System User</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile List View */}
            <div className="mobile-only" style={{ display: "none" }}>
              {filteredAndSortedMembers.map((member) => {
                const profile = getMemberProfile(member);
                const name = profile?.full_name || member.email || "Unnamed Member";
                const roleName = member.is_admin
                  ? "Administrator"
                  : resolveRole(member as any)?.name ?? "No Role";

                return (
                  <div
                    key={member.id}
                    style={{
                      padding: "1.15rem",
                      borderBottom: "1px solid var(--border-soft)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className="avatar"
                        style={{
                          background: getAvatarColor(name),
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: "700",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ fontSize: "14px" }}>{name}</strong>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>{member.email}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        className={`badge ${
                          member.is_admin
                            ? "cancelled"
                            : member.role_id
                            ? "priority-medium"
                            : "not-started"
                        }`}
                        style={{ fontSize: "10.5px" }}
                      >
                        {roleName}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                        Joined {formatDate(member.created_at)}
                      </span>
                    </div>

                    {canEdit && !member.is_admin && (
                      <button
                        type="button"
                        className="button ghost small"
                        onClick={() => handleOpenManageModal(member)}
                        style={{
                          width: "100%",
                          textAlign: "center",
                          justifyContent: "center",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          minHeight: "34px"
                        }}
                      >
                        <Settings size={14} />
                        Manage User
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
            <Search size={32} style={{ color: "var(--muted)", marginBottom: "0.75rem" }} />
            <h2>No members found</h2>
            <p className="muted" style={{ maxWidth: "340px", margin: "0 auto 1.5rem" }}>
              No organization members matched your search query or filter selection. Try adjusting them.
            </p>
          </div>
        )}
      </section>

      {/* Create User Modal */}
      {createOpen && (
        <dialog
          open={createOpen}
          className="modal"
          onClose={() => setCreateOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <div className="modal-content">
            <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Create New User</h2>
            <p className="muted" style={{ fontSize: "13px", marginBottom: "1.25rem" }}>
              Create an internal staff account. They can sign in immediately with these credentials.
            </p>

            <form action={createStaffAccount} className="form-stack">
              <label>
                Full Name
                <input name="full_name" type="text" placeholder="Nimal Perera" required />
              </label>

              <label>
                Email Address
                <input name="email" type="email" placeholder="staff@company.com" required />
              </label>

              <label>
                Temporary Password
                <input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required />
              </label>

              <label>
                Assigned Role
                <select name="role_id" required>
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option value={role.id} key={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button className="button primary" type="submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Manage User Modal */}
      {manageOpen && selectedMember && (
        <dialog
          open={manageOpen}
          className="modal"
          onClose={() => setManageOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setManageOpen(false);
          }}
        >
          <div className="modal-content" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span
                className="avatar"
                style={{
                  background: getAvatarColor(selectedMemberProfile?.full_name || selectedMember.email || ""),
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {(selectedMemberProfile?.full_name || selectedMember.email || "U").charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 style={{ fontSize: "1.25rem", margin: "0", lineHeight: "1.2" }}>
                  {selectedMemberProfile?.full_name || selectedMember.email}
                </h2>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{selectedMemberRoleName}</span>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border)",
                marginBottom: "1.25rem",
                gap: "0.5rem",
                overflowX: "auto"
              }}
            >
              {(['profile', 'role', 'password', 'danger'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "none",
                    borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                    color: activeTab === tab ? "var(--primary)" : "var(--muted)",
                    fontWeight: activeTab === tab ? "700" : "500",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 150ms ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  {tab === "profile" && "Profile"}
                  {tab === "role" && "Access & Role"}
                  {tab === "password" && "Password"}
                  {tab === "danger" && "Danger Zone"}
                </button>
              ))}
            </div>

            {/* Tab: Profile Info */}
            {activeTab === 'profile' && (
              <form action={editStaffMember} className="form-stack">
                <input type="hidden" name="member_id" value={selectedMember.id} />
                
                <label>
                  Full Name
                  <input
                    name="full_name"
                    type="text"
                    defaultValue={selectedMemberProfile?.full_name || ""}
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedMember.email || ""}
                    required
                  />
                </label>

                <div className="modal-actions" style={{ marginTop: "1rem" }}>
                  <button className="button ghost" type="button" onClick={() => setManageOpen(false)}>
                    Cancel
                  </button>
                  <button className="button primary" type="submit">
                    Save Details
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Role & Permissions */}
            {activeTab === 'role' && (
              <form action={updateProfilePermissions} className="form-stack">
                <input type="hidden" name="member_id" value={selectedMember.id} />

                <label>
                  Assign Workspace Role
                  <select name="role_id" defaultValue={selectedMember.role_id ?? ""}>
                    <option value="">No Role (Restrict access)</option>
                    {roles.map((roleItem) => (
                      <option value={roleItem.id} key={roleItem.id}>
                        {roleItem.name}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="helper-text" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "0.25rem" }}>
                  Changing the role immediately affects their viewable boards, tasks, and administrative privileges.
                </p>

                <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
                  <button className="button ghost" type="button" onClick={() => setManageOpen(false)}>
                    Cancel
                  </button>
                  <button className="button primary" type="submit">
                    Update Role
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Reset Password */}
            {activeTab === 'password' && (
              <form action={resetStaffPassword} className="form-stack">
                <input type="hidden" name="member_user_id" value={selectedMember.user_id} />

                <label>
                  New Temporary Password
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="Enter at least 8 characters"
                    required
                  />
                </label>

                <p className="helper-text" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "0.25rem" }}>
                  Set a new password for the user. They must use this to log in next time.
                </p>

                <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
                  <button className="button ghost" type="button" onClick={() => setManageOpen(false)}>
                    Cancel
                  </button>
                  <button className="button primary" type="submit">
                    Reset Password
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Danger Zone */}
            {activeTab === 'danger' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div
                  style={{
                    background: "var(--danger-soft)",
                    border: "1px solid #fee2e2",
                    borderRadius: "var(--radius)",
                    padding: "0.95rem",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start"
                  }}
                >
                  <ShieldAlert size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#7f1d1d", fontSize: "13px" }}>Critical Action</strong>
                    <p style={{ color: "#7f1d1d", fontSize: "11.5px", margin: "0.25rem 0 0" }}>
                      Deleting this account deletes their workspace membership, logs them out, and revokes all credentials. 
                      Their contributions (tasks, comments) will remain but will show as unassigned or authored by a deleted user.
                    </p>
                  </div>
                </div>

                <form action={deleteStaffMember} className="form-stack">
                  <input type="hidden" name="member_id" value={selectedMember.id} />
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button className="button ghost" type="button" onClick={() => setManageOpen(false)}>
                      Cancel
                    </button>
                    <button className="button danger" type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <Trash2 size={14} />
                      Delete Account Permanently
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </dialog>
      )}

      {/* Styled Responsive Styles are now in globals.css */}
    </div>
  );
}
