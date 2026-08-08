'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Paperclip, Search, Circle } from 'lucide-react';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { Message } from '@/types';

export default function DirectMessageUserPage() {
  const params = useParams();
  const userId = (params?.id as string) || 'usr-2';

  const recipient = MOCK_PROFILES.find((p) => p.id === userId) || MOCK_PROFILES[1];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'dm-1',
      sender_id: 'usr-2',
      sender: recipient,
      content: 'Hey Alex, do you have a moment to review the SOC2 audit report draft?',
      created_at: '2026-08-08T09:30:00Z',
    },
    {
      id: 'dm-2',
      sender_id: 'usr-1',
      sender: MOCK_PROFILES[0],
      content: 'Yes Sarah! Looking at it now in the Google Drive file explorer.',
      created_at: '2026-08-08T09:32:00Z',
    },
  ]);
  const [inputContent, setInputContent] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const newMsg: Message = {
      id: `dm-${Date.now()}`,
      sender_id: 'usr-1',
      sender: MOCK_PROFILES[0],
      receiver_id: recipient.id,
      content: inputContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputContent('');
  };

  return (
    <div className="h-[calc(100vh-7rem)] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
      {/* People Sidebar */}
      <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/40 p-4 space-y-4 flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Messages</h3>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {MOCK_PROFILES.slice(1).map((usr) => {
            const isActive = usr.id === recipient.id;
            return (
              <Link
                key={usr.id}
                href={`/direct-messages/${usr.id}`}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={usr.avatar_url}
                    alt={usr.full_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate font-bold">{usr.full_name}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {usr.job_title}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main DM Chat Feed */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
        {/* DM Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={recipient.avatar_url}
                alt={recipient.full_name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute bottom-0 right-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{recipient.full_name}</h3>
              <p className="text-[11px] text-slate-400">{recipient.job_title} • Online</p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <img
                src={msg.sender?.avatar_url}
                alt={msg.sender?.full_name}
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-200">{msg.sender?.full_name}</span>
                  <span className="text-[10px] text-slate-500">09:32 AM</span>
                </div>
                <div className="mt-1 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 inline-block max-w-xl">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={`Message ${recipient.full_name}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
