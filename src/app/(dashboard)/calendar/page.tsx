'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { MOCK_TASKS, MOCK_PROJECTS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState('August 2026');

  // Days in August 2026 (Demo Grid)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-brand-400" /> Milestone & Task Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track key project release dates, task deadlines, and sprint milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs">
            <button className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-200 px-2">{currentMonth}</span>
            <button className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 border-b border-slate-800/80 pb-2">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const isToday = day === 8;
            const hasHelmTask = day === 14;
            const hasBankingTask = day === 11;
            const hasBioTask = day === 20;

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-md'
                    : 'bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center'
                        : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && <span className="text-[9px] font-extrabold uppercase text-brand-400">Today</span>}
                </div>

                <div className="space-y-1 my-1">
                  {hasHelmTask && (
                    <div className="p-1 rounded bg-brand-500/20 border border-brand-500/40 text-[10px] font-bold text-brand-300 truncate">
                      Helm Deployment
                    </div>
                  )}
                  {hasBankingTask && (
                    <div className="p-1 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 truncate">
                      Figma Tokens
                    </div>
                  )}
                  {hasBioTask && (
                    <div className="p-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 truncate">
                      Biometrics Hook
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
