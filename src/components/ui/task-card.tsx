'use client';

import React, { useState } from 'react';
import { Clock, CheckSquare, Square, Tag } from 'lucide-react';
import { Task } from '@/types';
import { StatusBadge } from './status-badge';
import { formatDate } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStatusToggle?: (taskId: string, currentStatus: string) => void;
}

export function TaskCard({ task, onStatusToggle }: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === 'done');

  const handleCheckboxClick = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    if (onStatusToggle) {
      onStatusToggle(task.id, nextState ? 'done' : 'todo');
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
            <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">{task.project_title || 'General'}</span>
          </span>
          <StatusBadge status={task.priority} showDot={false} />
        </div>

        <div className="flex items-start gap-2.5">
          <button
            onClick={handleCheckboxClick}
            className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
          >
            {isCompleted ? (
              <CheckSquare className="w-4 h-4 text-emerald-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <h4
            className={`text-xs font-bold text-slate-900 dark:text-slate-100 transition-all ${
              isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {task.title}
          </h4>
        </div>

        {task.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(task.due_date)}</span>
        </div>

        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <img
              src={task.assignee.avatar_url}
              alt={task.assignee.full_name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
              title={task.assignee.full_name}
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[80px]">
              {task.assignee.full_name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
