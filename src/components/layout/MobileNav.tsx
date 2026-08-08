'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, MessageSquare, Folder, Settings } from 'lucide-react';

const MOBILE_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Chat', href: '/channels', icon: MessageSquare },
  { label: 'Files', href: '/files', icon: Folder },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
      {MOBILE_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-all ${
              isActive ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
