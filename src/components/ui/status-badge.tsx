import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'done'
  | 'pending'
  | 'todo'
  | 'backlog'
  | 'blocked'
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'planning'
  | 'on_hold';

interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace('-', '_');

  let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotStyle = 'bg-slate-400';
  let label = status.replace('_', ' ');

  switch (normalized) {
    case 'active':
    case 'in_progress':
      badgeStyle = 'bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30';
      dotStyle = 'bg-sky-500';
      label = normalized === 'in_progress' ? 'In Progress' : 'Active';
      break;
    case 'completed':
    case 'done':
      badgeStyle = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      dotStyle = 'bg-emerald-500';
      label = normalized === 'completed' ? 'Completed' : 'Done';
      break;
    case 'pending':
    case 'todo':
    case 'backlog':
    case 'medium':
      badgeStyle = 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
      dotStyle = 'bg-amber-500';
      label = normalized === 'todo' ? 'To Do' : normalized === 'backlog' ? 'Backlog' : 'Pending';
      break;
    case 'blocked':
    case 'urgent':
    case 'high':
      badgeStyle = 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30';
      dotStyle = 'bg-rose-500';
      label = normalized === 'urgent' ? 'Urgent' : normalized === 'high' ? 'High' : 'Blocked';
      break;
    case 'planning':
      badgeStyle = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30';
      dotStyle = 'bg-indigo-500';
      label = 'Planning';
      break;
    case 'on_hold':
    case 'low':
      badgeStyle = 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      dotStyle = 'bg-slate-400';
      label = normalized === 'on_hold' ? 'On Hold' : 'Low';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border capitalize transition-colors',
        badgeStyle,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyle)} />}
      <span>{label}</span>
    </span>
  );
}
