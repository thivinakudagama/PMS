'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { MOCK_ORGANIZATIONS } from '@/lib/mock-data';
import { Organization } from '@/types';

export function OrgSwitcher() {
  const [selectedOrg, setSelectedOrg] = useState<Organization>(MOCK_ORGANIZATIONS[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-100 transition-all text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {selectedOrg.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-brand-300 transition-colors">
              {selectedOrg.name}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">Acme Global</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Organizations
            </div>
            {MOCK_ORGANIZATIONS.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setSelectedOrg(org);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedOrg.id === org.id
                    ? 'bg-brand-500/15 text-brand-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{org.name}</span>
                </div>
                {selectedOrg.id === org.id && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
              </button>
            ))}

            <div className="pt-1.5 border-t border-slate-800">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <Plus className="w-4 h-4 text-brand-400" /> Create New Org
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
