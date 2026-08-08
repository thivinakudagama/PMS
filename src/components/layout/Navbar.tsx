'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Plus, HardDrive, Check, ExternalLink, Menu } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenCreateProjectModal: () => void;
  onToggleMobileNav: () => void;
}

export function Navbar({ onOpenSearch, onOpenCreateProjectModal, onToggleMobileNav }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 text-xs transition-all w-52 md:w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search tasks, projects...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400 border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Google Drive Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Drive Connected</span>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenCreateProjectModal}
          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.link || '/inbox'}
                      onClick={() => setShowNotifications(false)}
                      className={`block p-2.5 rounded-xl border text-xs transition-colors ${
                        notif.is_read
                          ? 'bg-slate-800/30 border-slate-800 text-slate-400'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:border-brand-500/40'
                      }`}
                    >
                      <div className="font-semibold text-slate-200 flex items-center justify-between">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">2h ago</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{notif.message}</p>
                    </Link>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <Link
                    href="/inbox"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-brand-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    View All Notifications <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
