'use client';

import Link from 'next/link';
import { Bell, CheckCircle, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { NotificationItem } from '@/types';

export default function InboxPage() {
  const { notifications, markNotificationRead } = useApp();

  const markAllRead = () => {
    notifications.forEach(n => {
      if (!n.is_read) {
        markNotificationRead(n.id);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-400" /> Inbox & Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated with task assignments, channel mentions, and file uploads.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" /> Mark All Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-800/60">
        {notifications.map((n: NotificationItem) => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
              n.is_read ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-800/40 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  n.is_read ? 'bg-slate-700' : 'bg-brand-500 animate-pulse'
                }`}
              />
              <div>
                <h4 className="text-xs font-bold text-slate-100">{n.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {n.link && (
              <Link
                href={n.link}
                onClick={() => markNotificationRead(n.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-all"
              >
                <span>View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No notifications yet!
          </div>
        )}
      </div>
    </div>
  );
}
