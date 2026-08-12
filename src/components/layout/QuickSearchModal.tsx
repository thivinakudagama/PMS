'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FolderKanban, CheckSquare, MessageSquare, X } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Project, Task, Channel } from '@/types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const { projects, tasks, channels } = useApp();

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p: Project) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredTasks = tasks.filter((t: Task) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredChannels = channels.filter((c: Channel) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search projects, tasks, or channels..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Projects */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" /> Projects ({filteredProjects.length})
            </h5>
            <div className="space-y-1">
              {filteredProjects.map((p: Project) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold">{p.title}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{p.status}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" /> Tasks ({filteredTasks.length})
            </h5>
            <div className="space-y-1">
              {filteredTasks.map((t: Task) => (
                <Link
                  key={t.id}
                  href="/tasks"
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <div>
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-[10px] text-slate-400">{t.project_title || ''}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">{t.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Channels ({filteredChannels.length})
            </h5>
            <div className="space-y-1">
              {filteredChannels.map((c: Channel) => (
                <Link
                  key={c.id}
                  href={`/channels/${c.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <span className="font-semibold">#{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-right text-[11px] text-slate-500">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">ESC</kbd> to exit
        </div>
      </div>
    </div>
  );
}
