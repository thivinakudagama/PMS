'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Hash,
  Lock,
  Send,
  Paperclip,
  Smile,
  Plus,
  Users,
  Search,
  CheckCheck,
} from 'lucide-react';
import { MOCK_CHANNELS, MOCK_MESSAGES, MOCK_PROFILES } from '@/lib/mock-data';
import { Message } from '@/types';

export default function ChannelChatPage() {
  const params = useParams();
  const channelId = (params?.id as string) || 'chan-1';
  
  const currentChannel = MOCK_CHANNELS.find((c) => c.id === channelId) || MOCK_CHANNELS[0];
  const [messages, setMessages] = useState<Message[]>(
    MOCK_MESSAGES.filter((m) => m.channel_id === channelId || m.channel_id === 'chan-1')
  );
  const [inputContent, setInputContent] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channel_id: currentChannel.id,
      sender_id: 'usr-1',
      sender: MOCK_PROFILES[0],
      content: inputContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputContent('');
  };

  return (
    <div className="h-[calc(100vh-7rem)] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
      {/* Channels Navigation Rail */}
      <div className="w-full md:w-64 border-r border-slate-800 bg-slate-950/40 p-4 space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Channels</h3>
          <button className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {MOCK_CHANNELS.map((chan) => {
            const isActive = chan.id === currentChannel.id;
            return (
              <Link
                key={chan.id}
                href={`/channels/${chan.id}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {chan.is_private ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                  <span className="truncate">{chan.name}</span>
                </div>
                {chan.unread_count && chan.unread_count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-600">
                    {chan.unread_count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            {currentChannel.is_private ? (
              <Lock className="w-4 h-4 text-slate-400" />
            ) : (
              <Hash className="w-4 h-4 text-brand-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-100">{currentChannel.name}</h3>
              <p className="text-[11px] text-slate-400 truncate">{currentChannel.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 5 Members
            </span>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group">
              <img
                src={msg.sender?.avatar_url}
                alt={msg.sender?.full_name}
                className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-200">{msg.sender?.full_name}</span>
                  <span className="text-[10px] text-slate-500">10:45 AM</span>
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
              title="Attach Google Drive File"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={`Message #${currentChannel.name}...`}
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
