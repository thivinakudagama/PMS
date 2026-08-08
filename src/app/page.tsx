import Link from 'next/link';
import { ArrowRight, CheckCircle2, FolderKanban, ShieldCheck, HardDrive, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header Nav */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-brand-400">
            PMS Enterprise
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all"
          >
            Go to App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Next.js App Router + Supabase Auth & RLS + Google Drive
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-3xl leading-tight mb-6">
          Multi-Tenant Project & Task Workspace for High-Velocity Teams
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-10">
          Streamline projects, Kanban task boards, real-time channels, direct messaging, role-based access controls, and Google Drive files in one unified platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 text-base font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 text-base font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md transition-all"
          >
            Explore Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Multi-Tenant RBAC</h3>
            <p className="text-slate-400 text-sm">
              Role-based access matrices for Admin, Project Manager, Member, and Viewer with isolation at the organization layer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Google Drive Integration</h3>
            <p className="text-slate-400 text-sm">
              Direct cloud attachment storage with service account folder creation and web view previews.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Real-Time Messaging</h3>
            <p className="text-slate-400 text-sm">
              Group project channels and private 1-on-1 direct messages built on Supabase real-time channels.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Enterprise PMS Built with Next.js App Router, Tailwind CSS, Supabase SSR, and Google Drive API.
      </footer>
    </div>
  );
}
