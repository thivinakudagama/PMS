'use client';

import { useState } from 'react';
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
import { StatCard } from '@/components/ui/stat-card';
import { ProjectCard } from '@/components/ui/project-card';
import { TaskCard } from '@/components/ui/task-card';
import { ProjectForm } from '@/components/ui/project-form';

export default function DashboardPage() {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === 'active');
  const pendingTasks = MOCK_TASKS.filter((t) => t.status !== 'done');
  const completedTasks = MOCK_TASKS.filter((t) => t.status === 'done');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Acme Global Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, Alex Rivera 👋
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Here is your organizational project health and sprint summary for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
          <Link
            href="/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Projects"
          value={activeProjects.length}
          subtitle="4 registered projects"
          icon={FolderKanban}
          trend={{ value: '+12%', isPositive: true }}
          iconColor="text-indigo-600 bg-indigo-500/10 dark:text-indigo-400"
        />

        <StatCard
          title="Open Sprint Tasks"
          value={pendingTasks.length}
          subtitle="Across 3 project boards"
          icon={CheckSquare}
          trend={{ value: '2 Urgent', isPositive: false }}
          iconColor="text-amber-600 bg-amber-500/10 dark:text-amber-400"
        />

        <StatCard
          title="Completed Deliverables"
          value={completedTasks.length}
          subtitle="This active sprint"
          icon={TrendingUp}
          trend={{ value: '+85%', isPositive: true }}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
        />

        <StatCard
          title="Active Team Members"
          value="5"
          subtitle="1 Admin, 1 PM, 2 Members, 1 Viewer"
          icon={Users}
          iconColor="text-sky-600 bg-sky-500/10 dark:text-sky-400"
        />
      </div>

      {/* Projects & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Active Projects Overview
            </h3>
            <Link
              href="/projects"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PROJECTS.slice(0, 4).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Recent Activity Feed Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Recent Activity Stream
            </h3>
            <Link href="/activity" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
              Full log
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            {MOCK_ACTIVITIES.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-3 last:pb-0 last:border-0"
              >
                <img
                  src={act.user?.avatar_url}
                  alt={act.user?.full_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {act.user?.full_name}
                    </span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">{act.action}</span>
                  </p>
                  <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                    {act.entity_title}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">
                    Just now
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-500" /> Priority Sprint Tasks
          </h3>
          <Link href="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            Task Board →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_TASKS.slice(0, 3).map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      <ProjectForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
