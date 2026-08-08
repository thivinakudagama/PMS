'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  HardDrive,
  MessageSquare,
  Plus,
  Calendar,
  Users,
  Clock,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_FILES, MOCK_PROFILES } from '@/lib/mock-data';
import { Task, TaskStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const KANBAN_COLUMNS: { label: string; status: TaskStatus; color: string }[] = [
  { label: 'Backlog', status: 'backlog', color: 'border-slate-700 text-slate-400' },
  { label: 'To Do', status: 'todo', color: 'border-amber-500/50 text-amber-400' },
  { label: 'In Progress', status: 'in_progress', color: 'border-brand-500/50 text-brand-400' },
  { label: 'In Review', status: 'in_review', color: 'border-indigo-500/50 text-indigo-400' },
  { label: 'Done', status: 'done', color: 'border-emerald-500/50 text-emerald-400' },
];

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = (params?.id as string) || 'proj-101';
  
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS.filter((t) => t.project_id === project.id));
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'files' | 'chat'>('kanban');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);

  const handleAddTask = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      project_id: project.id,
      project_title: project.title,
      title: newTaskTitle,
      status,
      priority: 'medium',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
      assignee: MOCK_PROFILES[2],
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setAddingStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Project Banner Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/30">
                {project.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                {project.priority} priority
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{project.title}</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {(project.members || []).map((m, idx) => (
                <img
                  key={idx}
                  src={m.avatar_url}
                  alt={m.full_name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-slate-900"
                  title={m.full_name}
                />
              ))}
            </div>
            <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'kanban'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-4 h-4" /> Kanban Board
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'list'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Task List ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'files'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" /> Drive Attachments
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'chat'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Project Channel
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);

            return (
              <div key={col.status} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col min-w-[260px]">
                <div className={`flex items-center justify-between pb-2 mb-3 border-b ${col.color}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{col.label}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 min-h-[300px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-brand-500/50 transition-all shadow-md space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/20 text-red-400'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-slate-400">{formatDate(task.due_date)}</span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-100">{task.title}</h5>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <img
                            src={task.assignee?.avatar_url}
                            alt={task.assignee?.full_name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="truncate max-w-[90px]">{task.assignee?.full_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {addingStatus === col.status ? (
                    <div className="p-3 rounded-xl bg-slate-800 border border-brand-500 space-y-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setAddingStatus(null)}
                          className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTask(col.status)}
                          className="px-3 py-1 rounded bg-brand-500 text-white text-[11px] font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingStatus(col.status)}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-4">Task Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-slate-100">{task.title}</td>
                  <td className="p-4 capitalize text-brand-400">{task.status.replace('_', ' ')}</td>
                  <td className="p-4 capitalize text-slate-300">{task.priority}</td>
                  <td className="p-4 flex items-center gap-2">
                    <img
                      src={task.assignee?.avatar_url}
                      alt={task.assignee?.full_name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{task.assignee?.full_name}</span>
                  </td>
                  <td className="p-4 text-slate-400">{formatDate(task.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
          <HardDrive className="w-10 h-10 text-brand-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">Project Google Drive Folder</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All attachments for <span className="text-slate-200 font-semibold">{project.title}</span> are stored and permissions-managed via Google Drive API.
          </p>
          <Link
            href="/files"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-md"
          >
            Open File Explorer
          </Link>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
          <MessageSquare className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">Project Discussion Channel</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Join the dedicated group chat channel for real-time team collaboration on this project.
          </p>
          <Link
            href="/channels/chan-2"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
          >
            Open #proj-cloud-infra Channel
          </Link>
        </div>
      )}
    </div>
  );
}
