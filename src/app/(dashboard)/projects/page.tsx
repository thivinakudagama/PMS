'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { MOCK_PROJECTS } from '@/lib/mock-data';
import { Project, ProjectStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSuccess = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-brand-400" /> Organization Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, organize, and monitor project milestones across teams.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter projects by title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['all', 'active', 'planning', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="p-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const total = project.task_count || 10;
            const done = project.completed_task_count || 4;
            const percent = Math.round((done / total) * 100);

            return (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-brand-500/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        project.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : project.status === 'planning'
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {project.status}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        project.priority === 'urgent'
                          ? 'text-red-400 bg-red-500/10'
                          : project.priority === 'high'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {project.priority} priority
                    </span>
                  </div>

                  <Link href={`/projects/${project.id}`} className="block group-hover:text-brand-300 transition-colors">
                    <h3 className="text-base font-bold text-slate-100">{project.title}</h3>
                  </Link>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{project.description}</p>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 text-[11px]">Tasks Completed ({done}/{total})</span>
                      <span className="font-bold text-brand-400 text-[11px]">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Team Avatars & Due Date */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(project.members || []).map((m, idx) => (
                        <img
                          key={idx}
                          src={m.avatar_url}
                          alt={m.full_name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-slate-900"
                          title={m.full_name}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(project.due_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Project Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProjects.map((p) => {
                const total = p.task_count || 10;
                const done = p.completed_task_count || 4;
                const percent = Math.round((done / total) * 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-100">
                      <Link href={`/projects/${p.id}`} className="hover:text-brand-300">
                        {p.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/30">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-slate-300">{p.priority}</td>
                    <td className="p-4 font-semibold text-brand-400">{percent}%</td>
                    <td className="p-4 text-slate-400">{formatDate(p.due_date)}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                      >
                        View Project
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
