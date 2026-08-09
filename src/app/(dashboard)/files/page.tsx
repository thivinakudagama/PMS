'use client';

import { useState } from 'react';
import {
  Folder,
  HardDrive,
  Upload,
  FileText,
  ExternalLink,
  Search,
  CheckCircle2,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { FileItem } from '@/types';
import { formatBytes, formatDate } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export default function FilesPage() {
  const { files, projects, addFile } = useApp();
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [fileName, setFileName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj-1');

  const filteredFiles = files.filter((f) =>
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    await addFile({
      name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      project_id: projectId,
      web_view_link: 'https://drive.google.com/file/d/demo/view',
    });

    setShowUploadModal(false);
    setFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <HardDrive className="w-6 h-6 text-brand-400" /> Google Drive File Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Central organization files and project attachments synchronized via Google Drive API.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" /> Upload to Google Drive
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              Google Drive Root Folder: <span className="text-cyan-400 font-mono">/Acme_PMS_Drive/</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated service account storage active • All uploads assigned project read permissions
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Service Active
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by file name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredFiles.length} file attachments
        </span>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{formatBytes(file.file_size)}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                {file.file_name}
              </h4>
              <p className="text-[11px] text-brand-400 font-medium mt-1">
                Project: {file.project_title || 'Organization General'}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <img
                  src={file.uploader?.avatar_url}
                  alt={file.uploader?.full_name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{file.uploader?.full_name}</span>
              </div>

              <a
                href={file.web_view_link}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>View in Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-400" /> Upload File to Google Drive
            </h3>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  File Document Name *
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Architecture_Specs_2026.pdf"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Attach to Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-2 bg-slate-950/50">
                <Upload className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Drag & drop files here or click to browse</p>
                <span className="text-[10px] text-slate-500">Supports PDF, DOCX, FIG, PNG up to 100MB</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-md"
                >
                  Upload & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
