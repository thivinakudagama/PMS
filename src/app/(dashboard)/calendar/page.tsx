'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export default function CalendarPage() {
  const { tasks } = useApp();
  const [currentMonth] = useState('August 2026');

  // Days in August 2026
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-400" /> Milestone & Task Calendar
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
            const isToday = day === 9;
            const dayTasks = tasks.filter((t) => {
              if (!t.due_date) return false;
              const d = new Date(t.due_date);
              return d.getDate() === day;
            });

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md'
                    : 'bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                        : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && <span className="text-[9px] font-extrabold uppercase text-indigo-400">Today</span>}
                </div>

                <div className="space-y-1 my-1">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 truncate"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
