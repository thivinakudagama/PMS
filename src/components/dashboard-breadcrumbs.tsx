"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const labelMap = new Map<string, string>([
  ["/dashboard", "Dashboard"],
  ["/projects", "Projects"],
  ["/tasks", "Tasks"],
  ["/team", "Team"],
  ["/roles", "Roles"],
  ["/reports", "Reports"],
  ["/calendar", "Calendar"],
  ["/files", "Files"],
  ["/settings", "Settings"],
  ["/inbox", "Inbox"],
  ["/channels", "Channels"],
  ["/direct-messages", "Direct Messages"],
  ["/activity", "Activity"],
  ["/search", "Search"]
]);

function toLabel(segment: string) {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return {
      href,
      label: labelMap.get(href) ?? toLabel(segment)
    };
  });

  return (
    <nav className="dashboard-breadcrumbs" aria-label="Breadcrumb">
      <Link href="/dashboard" className="breadcrumb-home" aria-label="Dashboard">
        <Home size={18} />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span className="breadcrumb-item" key={crumb.href}>
            <ChevronRight size={16} />
            {isLast ? (
              <span className="breadcrumb-current">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="breadcrumb-link">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
