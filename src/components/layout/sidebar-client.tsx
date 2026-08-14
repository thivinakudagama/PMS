'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar as CalendarIcon,
  HardDrive,
  BarChart3,
  Bell,
  MessageSquare,
  Hash,
  Lock,
  UserCheck,
  Users,
  ShieldAlert,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
} from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';
import { useApp } from '@/context/app-context';

interface SidebarClientProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SidebarClient({ collapsed, onToggleCollapse }: SidebarClientProps) {
  const pathname = usePathname();
  const { projects, tasks, channels, currentUser, notifications } = useApp();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const MAIN_NAV = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban, badge: projects.length.toString() },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare, badge: tasks.length.toString() },
    { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { label: 'Files', href: '/files', icon: HardDrive },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const WORKSPACE_NAV = [
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Roles (RBAC)', href: '/roles', icon: ShieldAlert },
    { label: 'Activity', href: '/activity', icon: Activity },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];


  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Section: Logo & Org Switcher */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400">
                PMS Core
              </span>
            </div>
          )}
          {collapsed && (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && <OrgSwitcher />}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {/* Main Group */}
        <div>
          {!collapsed && (
            <h5 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Main
            </h5>
          )}
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
                    }`}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Communication Group */}
        <div>
          {!collapsed && (
            <h5 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Communication
            </h5>
          )}
          <div className="space-y-0.5">
            <Link
              href="/inbox"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                pathname === '/inbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Bell className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-500" />
              {!collapsed && <span className="truncate flex-1">Inbox</span>}
              {!collapsed && unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Channels listing */}
            {!collapsed && (
              <div className="pt-2">
                <div className="px-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
                  <span>Channels</span>
                  <Link href="/channels" className="hover:text-indigo-500">
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {channels.slice(0, 3).map((chan) => (
                  <Link
                    key={chan.id}
                    href={`/channels/${chan.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 truncate"
                  >
                    {chan.is_private ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                    <span className="truncate">{chan.name}</span>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/direct-messages"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                pathname.startsWith('/direct-messages')
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <UserCheck className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-500" />
              {!collapsed && <span className="truncate flex-1">Direct Messages</span>}
            </Link>
          </div>
        </div>

        {/* Workspace Management Group */}
        <div>
          {!collapsed && (
            <h5 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Workspace
            </h5>
          )}
          <div className="space-y-0.5">
            {WORKSPACE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
                    }`}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Platform Admin Group */}
        {useApp().isSuperAdmin && (
          <div>
            {!collapsed && (
              <h5 className="px-3 text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 mt-2">
                <Lock className="w-3 h-3" />
                Platform Admin
              </h5>
            )}
            <div className="space-y-0.5">
              <Link
                href="/admin/platform"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  pathname === '/admin/platform'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? 'Platform Admin' : undefined}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 ${
                    pathname === '/admin/platform' ? 'text-white' : 'text-rose-400 group-hover:text-rose-500'
                  }`}
                />
                {!collapsed && <span className="truncate flex-1">Overview</span>}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={currentUser?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'}
            alt={currentUser?.full_name || 'User'}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.full_name || 'User'}
              </h5>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {useApp().currentUserRole || 'Member'}
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <Link
              href="/login"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
