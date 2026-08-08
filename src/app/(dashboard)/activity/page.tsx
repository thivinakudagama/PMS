'use client';

import { Activity, FolderKanban, CheckSquare, HardDrive } from 'lucide-react';
import { MOCK_ACTIVITIES } from '@/lib/mock-data';

export default function ActivityTimelinePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-indigo-400" /> Organization Activity Feed
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological audit trail of all project modifications, task updates, and file attachments.
        </p>
      </div>

      {/* Timeline Feed */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        {MOCK_ACTIVITIES.map((act, idx) => (
          <div key={act.id} className="relative flex items-start gap-4">
            {/* Timeline Vertical Bar */}
            {idx !== MOCK_ACTIVITIES.length - 1 && (
              <span className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800" />
            )}

            <img
              src={act.user?.avatar_url}
              alt={act.user?.full_name}
              className="w-8 h-8 rounded-full object-cover z-10 border border-slate-700 shrink-0"
            />

            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-100">{act.user?.full_name}</span>
                <span className="text-[10px] text-slate-500 font-mono">2h ago</span>
              </div>
              <p className="text-xs text-slate-300">
                <span className="text-slate-400">{act.action}</span>{' '}
                <span className="font-bold text-brand-300">"{act.entity_title}"</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
