'use client';

import { ShieldAlert, Check, X, Info } from 'lucide-react';

const PERMISSION_MATRIX = [
  { action: 'Manage Organization Settings', admin: true, pm: false, member: false, viewer: false },
  { action: 'Invite & Remove Members', admin: true, pm: true, member: false, viewer: false },
  { action: 'Change Member RBAC Roles', admin: true, pm: false, member: false, viewer: false },
  { action: 'Create & Delete Projects', admin: true, pm: true, member: false, viewer: false },
  { action: 'Edit Project Settings & Due Dates', admin: true, pm: true, member: false, viewer: false },
  { action: 'Create & Assign Tasks', admin: true, pm: true, member: true, viewer: false },
  { action: 'Move Task Status (Kanban)', admin: true, pm: true, member: true, viewer: false },
  { action: 'Upload Google Drive Files', admin: true, pm: true, member: true, viewer: false },
  { action: 'Post Channel & Direct Messages', admin: true, pm: true, member: true, viewer: false },
  { action: 'View Metrics & Analytics Reports', admin: true, pm: true, member: true, viewer: true },
];

export default function RolesMatrixPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-brand-400" /> RBAC Permission Matrix
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Granular role-based access control matrix enforced at application and Supabase RLS database levels.
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-3">
        <Info className="w-5 h-5 text-brand-400 shrink-0" />
        <p className="text-xs text-brand-200">
          Row Level Security (RLS) policies automatically isolate data and restrict write actions based on the user's role in <span className="font-mono text-white">public.organization_members</span>.
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="p-4">Action / Capability</th>
              <th className="p-4 text-center">Admin</th>
              <th className="p-4 text-center">Project Manager</th>
              <th className="p-4 text-center">Member</th>
              <th className="p-4 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {PERMISSION_MATRIX.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-semibold text-slate-200">{row.action}</td>
                <td className="p-4 text-center">
                  {row.admin ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.pm ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.member ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.viewer ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
