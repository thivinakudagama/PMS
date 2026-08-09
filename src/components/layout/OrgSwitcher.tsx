'use client';

import { Building2, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/app-context';

export function OrgSwitcher() {
  const { currentOrg } = useApp();

  const selectedOrg = currentOrg || {
    name: 'Acme Global Corp',
    slug: 'acme-corp',
    id: 'org-acme',
    created_at: new Date().toISOString(),
  };

  return (
    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
          {selectedOrg.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {selectedOrg.name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Company Workspace</span>
          </p>
        </div>
      </div>
      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
    </div>
  );
}

