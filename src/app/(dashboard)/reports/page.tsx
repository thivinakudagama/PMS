'use client';

import { BarChart3, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';

export default function ReportsPage() {
  const { projects, tasks } = useApp();

  const totalTasks = tasks.length || 1;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
  const backlogCount = tasks.filter((t) => t.status === 'todo' || t.status === 'backlog').length;

  const donePercent = Math.round((doneCount / totalTasks) * 100);
  const inProgressPercent = Math.round((inProgressCount / totalTasks) * 100);
  const backlogPercent = Math.round((backlogCount / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-indigo-400" /> Analytics & Reports
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Visual insights into project completion velocity, task distribution, and team throughput.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Sprint Completion Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{donePercent}%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500">{doneCount} of {tasks.length} tasks completed</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Average Task Cycle Time</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">3.2 Days</span>
            <span className="text-xs font-semibold text-indigo-400">Optimal</span>
          </div>
          <p className="text-[11px] text-slate-500">From To-Do to Done</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">On-Time Milestone Releases</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">92%</span>
            <span className="text-xs font-semibold text-emerald-400">High Reliability</span>
          </div>
          <p className="text-[11px] text-slate-500">Across {projects.length} active projects</p>
        </div>
      </div>

      {/* Visual Progress Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Task Status Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Completed (Done)</span>
                <span className="font-bold text-emerald-400">{donePercent}% ({doneCount} tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full text-indigo-400" style={{ width: `${donePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">In Progress & In Review</span>
                <span className="font-bold text-indigo-400">{inProgressPercent}% ({inProgressCount} tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${inProgressPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Backlog & To-Do</span>
                <span className="font-bold text-amber-400">{backlogPercent}% ({backlogCount} tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${backlogPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Completion Metrics */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Project Completion Metrics</h3>
          <div className="space-y-3">
            {projects.slice(0, 4).map((p) => {
              const pTasks = tasks.filter((t) => t.project_id === p.id);
              const pDone = pTasks.filter((t) => t.status === 'done').length;
              const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 50;

              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200 font-semibold">{p.title}</span>
                    <span className="text-indigo-400 font-bold">{pPct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
