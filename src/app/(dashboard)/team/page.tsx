'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Shield, Mail, MoreHorizontal, CheckCircle, ShieldAlert } from 'lucide-react';
import { OrganizationMember, OrgRole } from '@/types';
import { inviteMemberSchema } from '@/lib/validation';
import { useApp } from '@/context/app-context';

export default function TeamPage() {
  const { members, addMember, updateMemberRole, removeMember, currentUserRole } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<OrgRole>('Member');
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  if (typeof window !== 'undefined') {
    window.onclick = (e) => {
      if (!(e.target as Element).closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = inviteMemberSchema.safeParse({ email, role, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    try {
      await addMember(email, role, password);
      setShowInviteModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while inviting the member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-400" /> Team & Member Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage company team members, assign roles, and invite new collaborators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/roles"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-brand-400" /> View RBAC Matrix
          </Link>

        {currentUserRole === 'Admin' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="p-4">Member Name</th>
              <th className="p-4">Job Title / Department</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={m.user?.avatar_url}
                    alt={m.user?.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-slate-100">{m.user?.full_name}</div>
                    <div className="text-[11px] text-slate-400">{m.user?.email}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-slate-200 font-medium">{m.user?.job_title || 'Collaborator'}</div>
                  <div className="text-[11px] text-slate-500">{m.user?.department || 'General'}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      m.role === 'Admin'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        : m.role === 'Project Manager'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : m.role === 'Member'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
                <td className="p-4 text-right relative dropdown-container">
                  {currentUserRole === 'Admin' && (
                    <>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === m.id ? null : m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openDropdownId === m.id && (
                        <div className="absolute right-8 top-10 z-50 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-left py-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Role</div>
                          <button onClick={() => { updateMemberRole(m.id, 'Admin'); setOpenDropdownId(null); }} className="w-full px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left">Admin</button>
                          <button onClick={() => { updateMemberRole(m.id, 'Project Manager'); setOpenDropdownId(null); }} className="w-full px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left">Project Manager</button>
                          <button onClick={() => { updateMemberRole(m.id, 'Member'); setOpenDropdownId(null); }} className="w-full px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left">Member</button>
                          <button onClick={() => { updateMemberRole(m.id, 'Viewer'); setOpenDropdownId(null); }} className="w-full px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left">Viewer</button>
                          <div className="border-t border-slate-800 my-1"></div>
                          <button onClick={() => { if(confirm('Are you sure you want to remove this member?')) removeMember(m.id); setOpenDropdownId(null); }} className="w-full px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-left font-semibold">Remove Member</button>
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-400" /> Invite Company Team Member
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assign RBAC Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Project Manager">Project Manager (Manage Projects & Tasks)</option>
                  <option value="Member">Member (Create & Edit Tasks)</option>
                  <option value="Viewer">Viewer (Read-Only Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
