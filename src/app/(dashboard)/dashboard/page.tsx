'use client';

import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  HardDrive,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_ACTIVITIES, MOCK_FILES } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === 'active');
  const pendingTasks = MOCK_TASKS.filter((t) => t.status !== 'done');
  const urgentTasks = MOCK_TASKS.filter((t) => t.priority === 'urgent' || t.priority === 'high');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/80 via-slate-900 to-slate-900 border border-brand-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Acme Global Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            Welcome back, Alex Rivera 👋
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Here is your organizational project health and active sprint summary for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
          <Link
            href="/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* High Level Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-brand-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Projects</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{activeProjects.length}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">4 total registered projects</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Sprint Tasks</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{pendingTasks.length}</span>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5">
              <Clock className="w-3.5 h-3.5" /> {urgentTasks.length} urgent
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 active project boards</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Google Drive Files</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{MOCK_FILES.length}</span>
            <span className="text-xs font-semibold text-emerald-400">Synced</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Central Google Drive storage</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Team Members</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">5</span>
            <span className="text-xs font-semibold text-slate-400">RBAC Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">1 Admin, 1 PM, 2 Members, 1 Viewer</p>
        </div>
      </div>

      {/* Main Grid: Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Progress List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-400" /> Active Projects Overview
            </h3>
            <Link
              href="/projects"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PROJECTS.slice(0, 4).map((project) => {
              const total = project.task_count || 10;
              const done = project.completed_task_count || 5;
              const percent = Math.round((done / total) * 100);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          project.priority === 'urgent'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : project.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                        }`}
                      >
                        {project.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(project.due_date)}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Completion Progress</span>
                      <span className="font-bold text-brand-400">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Timeline Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Recent Activity Feed
            </h3>
            <Link href="/activity" className="text-xs text-slate-400 hover:text-slate-200">
              Full log
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            {MOCK_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3 last:pb-0 last:border-0">
                <img
                  src={act.user?.avatar_url}
                  alt={act.user?.full_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-300">
                    <span className="font-semibold text-slate-100">{act.user?.full_name}</span>{' '}
                    <span className="text-slate-400">{act.action}</span>
                  </p>
                  <p className="text-[11px] font-medium text-brand-400 truncate mt-0.5">
                    {act.entity_title}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Tasks Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Priority Sprint Tasks
          </h3>
          <Link href="/tasks" className="text-xs text-brand-400 hover:underline font-semibold">
            Task Board →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_TASKS.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-brand-400 font-medium truncate">{task.project_title}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize text-[10px]">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-100 mb-1">{task.title}</h5>
                <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <img
                    src={task.assignee?.avatar_url}
                    alt={task.assignee?.full_name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{task.assignee?.full_name}</span>
                </div>
                <span className="text-slate-400">{formatDate(task.due_date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
