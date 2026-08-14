"use client";

import Link from "next/link";
import { Bell, CheckSquare, FolderKanban, Grid2x2, LayoutGrid, Plus, Settings, Users, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const quickLinks = [
  { href: "/team", label: "Users", icon: Users },
  { href: "/inbox", label: "Inbox", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

function isActivePath(pathname: string | null, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname?.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const quickMenuActive = quickLinks.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {isQuickMenuOpen ? (
        <button
          type="button"
          aria-label="Close quick menu"
          onClick={() => setIsQuickMenuOpen(false)}
          className="mobile-bottom-backdrop"
        />
      ) : null}

      <nav className="mobile-bottom-nav" aria-label="Mobile project navigation">
        {isQuickMenuOpen ? (
          <div className="mobile-quick-menu">
            <p className="sidebar-label">Quick access</p>
            <div className="mobile-quick-list">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const active = isActivePath(pathname, link.href);

                return (
                  <Link
                    href={link.href}
                    key={link.href}
                    onClick={() => setIsQuickMenuOpen(false)}
                    className={`mobile-quick-link${active ? " active" : ""}`}
                  >
                    <span>
                      <Icon size={16} />
                      {link.label}
                    </span>
                    <small>Open</small>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mobile-bottom-items">
          <Link
            href="/dashboard"
            onClick={() => setIsQuickMenuOpen(false)}
            className={`mobile-bottom-link${isActivePath(pathname, "/dashboard") ? " active" : ""}`}
          >
            <LayoutGrid size={24} />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsQuickMenuOpen((current) => !current)}
            className={`mobile-bottom-link${quickMenuActive || isQuickMenuOpen ? " active" : ""}`}
          >
            <span className={`mobile-more-icon${isQuickMenuOpen ? " active" : ""}`}>
              {isQuickMenuOpen ? <X size={20} /> : <Grid2x2 size={20} />}
            </span>
            <span>More</span>
          </button>

          <Link href="/projects" className="mobile-primary-action" aria-label="Open projects">
            <Plus size={32} />
          </Link>

          <Link
            href="/tasks"
            onClick={() => setIsQuickMenuOpen(false)}
            className={`mobile-bottom-link${isActivePath(pathname, "/tasks") ? " active" : ""}`}
          >
            <CheckSquare size={24} />
            <span>Tasks</span>
          </Link>

          <Link
            href="/projects"
            onClick={() => setIsQuickMenuOpen(false)}
            className={`mobile-bottom-link${isActivePath(pathname, "/projects") ? " active" : ""}`}
          >
            <FolderKanban size={24} />
            <span>Projects</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
