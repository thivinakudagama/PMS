'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { dataService } from '@/lib/services/data-service';
import { Organization, UserProfile } from '@/types';
import { Users, Building2, FolderKanban, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function PlatformAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalOrgs: 0, totalProjects: 0 });
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (contextLoading) return;
    
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }

    const loadPlatformData = async () => {
      setLoading(true);
      const [platformStats, orgs, users] = await Promise.all([
        dataService.getPlatformStats(),
        dataService.getOrganizations(), // Admin RLS lets this return all
        dataService.getAllProfiles(),
      ]);
      
      setStats(platformStats);
      setAllOrgs(orgs);
      setAllUsers(users);
      setLoading(false);
    };

    loadPlatformData();
  }, [isSuperAdmin, contextLoading, router]);

  if (contextLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-4">
              <ShieldAlert className="w-3.5 h-3.5" />
              Super Admin Access
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              Platform Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cross-organizational management and system metrics.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalUsers}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Organizations</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalOrgs}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FolderKanban className="w-24 h-24 text-rose-500" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Projects</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalProjects}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Organizations Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                All Workspaces
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Slug</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {allOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3 text-slate-900 dark:text-slate-100 font-medium">
                        {org.name}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {org.slug}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {allOrgs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                        No organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                All Users
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                            alt="" 
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" 
                          />
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {user.full_name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
