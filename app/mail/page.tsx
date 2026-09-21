"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConversationView } from "@/components/mail/ConversationView";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { Mail, Search, FolderKanban, Send, Star, AlertOctagon, Inbox, RefreshCw, X } from "lucide-react";

export default function AllMailPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("ALL"); // ALL, INBOX, SENT, UNASSIGNED, WORKPLACE
  const [wpFilter, setWpFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMailData();
  }, []);

  const fetchMailData = async () => {
    setLoading(true);
    try {
      const [wpRes, actRes] = await Promise.all([
        fetch("/api/workplaces"),
        fetch("/api/gmail/sync"),
      ]);

      if (wpRes.ok) {
        const wps = await wpRes.json();
        setWorkplaces(wps);

        // Aggregate all threads across workplaces + independent threads
        const allThreads: any[] = [];
        wps.forEach((wp: any) => {
          (wp.threads || []).forEach((t: any) => {
            allThreads.push({ ...t, workplaceName: wp.name });
          });
        });

        setThreads(allThreads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorkplace = async (threadId: string, workplaceId: string) => {
    try {
      const res = await fetch("/api/mail/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, workplaceId }),
      });
      if (res.ok) fetchMailData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const text = `${t.subject} ${t.snippet} ${t.workplaceName || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());
    const matchesWp = wpFilter === "ALL" || t.workplaceId === wpFilter;
    const matchesFolder =
      folderFilter === "ALL" ||
      (folderFilter === "UNASSIGNED" && !t.workplaceId) ||
      (folderFilter === "WORKPLACE" && Boolean(t.workplaceId));

    return matchesSearch && matchesWp && matchesFolder;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Centralized Gmail Mailbox
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Mail className="w-6 h-6 text-indigo-400" />
              <span>All Mail (Indexed & Synchronized)</span>
            </h1>
            <p className="text-xs text-slate-400">
              Authoritative Gmail messages synchronized from September 15, 2026 to present.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Direct Compose</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search across sender, recipient, subject, email body, Workplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Folder Dropdown */}
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Folders</option>
              <option value="WORKPLACE">Workplace Mail</option>
              <option value="UNASSIGNED">Unassigned Mail</option>
            </select>

            {/* Workplace Dropdown */}
            <select
              value={wpFilter}
              onChange={(e) => setWpFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Workplaces</option>
              {workplaces.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mail List & Conversation Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Roster */}
          <div className={`${selectedThread ? "lg:col-span-1" : "lg:col-span-3"} space-y-3`}>
            {filteredThreads.map((thread) => {
              const msgCount = thread.messages?.length || 1;
              const lastMsgDate = new Date(thread.lastMessageAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });
              const isSelected = selectedThread?.id === thread.id;

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm truncate max-w-[200px]">
                        {thread.subject || "(No Subject)"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {msgCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{lastMsgDate}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{thread.snippet}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    {thread.workplaceName ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        <FolderKanban className="w-3 h-3" />
                        <span>{thread.workplaceName}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-medium">Unassigned</span>
                    )}

                    <span className="text-[10px] text-slate-500">Thread: {thread.id.substring(0, 12)}...</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation Detail Inspector */}
          {selectedThread && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedThread(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ConversationView
                threadId={selectedThread.id}
                subject={selectedThread.subject}
                workplaceName={selectedThread.workplaceName}
                workplaceId={selectedThread.workplaceId}
                messages={selectedThread.messages || []}
                onReply={(to, sub) => {
                  setIsComposeOpen(true);
                }}
                onAssignWorkplace={() => {
                  if (workplaces.length > 0) {
                    handleAssignWorkplace(selectedThread.id, workplaces[0].id);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchMailData}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchMailData}
      />
    </div>
  );
}
