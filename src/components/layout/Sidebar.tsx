import React from 'react';
import { SidebarClient } from './sidebar-client';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return <SidebarClient collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
}
