"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Files,
  FolderKanban,
  Hash,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

const iconMap = {
  activity: Activity,
  barChart3: BarChart3,
  bellRing: BellRing,
  calendarDays: CalendarDays,
  checkSquare: CheckSquare,
  files: Files,
  folderKanban: FolderKanban,
  hash: Hash,
  layoutDashboard: LayoutDashboard,
  messageSquare: MessageSquare,
  settings: Settings,
  shieldCheck: ShieldCheck,
  users: Users
} as const;

export type SidebarNavIcon = keyof typeof iconMap;

type NavItem = {
  href: string;
  label: string;
  icon: SidebarNavIcon;
  badge?: number | null;
};

type SidebarClientProps = {
  collaborationItems: NavItem[];
  workspaceItems: NavItem[];
  roleName: string;
  fullName: string;
  initialCollapsed: boolean;
  signOutAction: () => Promise<void>;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavGroup({
  label,
  items,
  collapsed
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="sidebar-section">
      {!collapsed ? <p className="sidebar-label">{label}</p> : null}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              href={item.href}
              key={item.href}
              className={`nav-item${active ? " active" : ""}${collapsed ? " collapsed" : ""}`}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
              {item.badge ? <strong className="nav-count">{item.badge}</strong> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function SidebarClient({
  collaborationItems,
  workspaceItems,
  roleName,
  fullName,
  initialCollapsed,
  signOutAction
}: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const primaryProjectItems = workspaceItems.filter((item) =>
    ["/dashboard", "/projects", "/tasks", "/calendar", "/files"].includes(item.href)
  );
  const adminItems = workspaceItems.filter((item) =>
    ["/team", "/roles", "/reports", "/settings"].includes(item.href)
  );

  useEffect(() => {
    window.localStorage.setItem("pms:sidebar-collapsed", String(collapsed));
    document.cookie = `pms:sidebar-collapsed=${collapsed}; path=/; max-age=31536000; samesite=lax`;
  }, [collapsed]);

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-collapse-button"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="sidebar-top">
        <Link href="/dashboard" className="brand brand-block">
          <span className="brand-logo-shell">
            <img src="/logo.png" alt="ProjectHub" className="brand-logo" />
          </span>
        </Link>
      </div>

      <div className="sidebar-scroll-area">
        <SidebarNavGroup
          label="Projects"
          items={primaryProjectItems}
          collapsed={collapsed}
        />
        <SidebarNavGroup
          label="Administration"
          items={adminItems}
          collapsed={collapsed}
        />
        <SidebarNavGroup label="Collaborate" items={collaborationItems} collapsed={collapsed} />
      </div>

      <div className="sidebar-footer">
        <div className={`sidebar-user-card${collapsed ? " collapsed" : ""}`}>
          <div className="sidebar-user-meta">
            <span className="avatar">{fullName.charAt(0).toUpperCase()}</span>
            {!collapsed ? (
              <div>
                <strong>{fullName}</strong>
                <p>{roleName}</p>
              </div>
            ) : null}
          </div>

          <form action={signOutAction}>
            <button className="sidebar-logout-button" type="submit" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
