import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Project } from '@/types';
import { StatusBadge } from './status-badge';
import { formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  orgName?: string;
}

export function ProjectCard({ project, orgName = 'Acme Global' }: ProjectCardProps) {
  const totalTasks = project.task_count || 12;
  const completedTasks = project.completed_task_count || 8;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            {orgName}
          </span>
          <StatusBadge status={project.status} />
        </div>

        <Link href={`/projects/${project.id}`} className="block">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {project.title}
          </h3>
        </Link>
        {project.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Progress Bar & Task Count */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Tasks ({completedTasks}/{totalTasks})
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Due Date & Member Avatar Stack */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex -space-x-2 overflow-hidden p-0.5">
            {(project.members || []).slice(0, 4).map((m, idx) => (
              <img
                key={idx}
                src={m.avatar_url}
                alt={m.full_name}
                className="inline-block w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                title={m.full_name}
              />
            ))}
            {(project.members || []).length > 4 && (
              <span className="flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                +{(project.members || []).length - 4}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(project.due_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
