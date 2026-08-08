'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  UserCheck,
  Folder,
  Calendar as CalendarIcon,
  Users,
  ShieldAlert,
  BarChart3,
  Bell,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';
import { MOCK_PROFILES } from '@/lib/mock-data';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban, badge: '4' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, badge: '14' },
  { label: 'Channels', href: '/channels', icon: MessageSquare, badge: '2' },
  { label: 'Direct Messages', href: '/direct-messages', icon: UserCheck },
  { label: 'Google Drive Files', href: '/files', icon: Folder },
  { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { label: 'Team Directory', href: '/team', icon: Users },
  { label: 'RBAC Matrix', href: '/roles', icon: ShieldAlert },
  { label: 'Reports & Metrics', href: '/reports', icon: BarChart3 },
  { label: 'Inbox', href: '/inbox', icon: Bell, badge: '2' },
  { label: 'Activity Timeline', href: '/activity', icon: Activity },
  { label: 'Org Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const currentUser = MOCK_PROFILES[0]; // Alex Rivera (Admin)

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Org Switcher */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-brand-400">
                PMS Core
              </span>
            </div>
          )}
          {collapsed && (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && <OrgSwitcher />}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600/90 to-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-300'}`} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-slate-100 truncate">{currentUser.full_name}</h5>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Admin
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <Link
              href="/login"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
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
