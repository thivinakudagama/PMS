'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
      <Link href="/dashboard" className="hover:text-slate-200 transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((segment, idx) => {
        const url = `/${segments.slice(0, idx + 1).join('/')}`;
        const isLast = idx === segments.length - 1;
        const formatted = segment.replace(/-/g, ' ');

        return (
          <div key={url} className="flex items-center gap-1.5 capitalize">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            {isLast ? (
              <span className="text-slate-200 font-semibold truncate max-w-[150px]">{formatted}</span>
            ) : (
              <Link href={url} className="hover:text-slate-200 transition-colors truncate max-w-[120px]">
                {formatted}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
