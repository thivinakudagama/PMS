'use client';

import { BarChart3, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-brand-400" /> Analytics & Reports
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
            <span className="text-3xl font-extrabold text-slate-100">84.2%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +5.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Target sprint goal: 80%</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Average Task Cycle Time</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">3.2 Days</span>
            <span className="text-xs font-semibold text-brand-400">Optimal</span>
          </div>
          <p className="text-[11px] text-slate-500">From To-Do to Done</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">On-Time Milestone Releases</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">92%</span>
            <span className="text-xs font-semibold text-emerald-400">High Reliability</span>
          </div>
          <p className="text-[11px] text-slate-500">Across 4 active projects</p>
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
                <span className="font-bold text-emerald-400">45% (18 tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">In Progress & In Review</span>
                <span className="font-bold text-brand-400">35% (14 tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Backlog & To-Do</span>
                <span className="font-bold text-amber-400">20% (8 tasks)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Completion Metrics */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Project Completion Metrics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-200 font-semibold">SOC2 Security Audit</span>
                <span className="text-emerald-400 font-bold">100%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-200 font-semibold">Cloud Infrastructure Migration</span>
                <span className="text-brand-400 font-bold">64%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-200 font-semibold">NextGen Mobile Banking</span>
                <span className="text-indigo-400 font-bold">50%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
