"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConversationView } from "@/components/mail/ConversationView";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { Inbox, FolderKanban, Send } from "lucide-react";

export default function InboxPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [inboxThreads, setInboxThreads] = useState<any[]>([]);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const res = await fetch("/api/workplaces");
      if (res.ok) {
        const wps = await res.json();
        const list: any[] = [];
        wps.forEach((wp: any) => {
          (wp.threads || []).forEach((t: any) => {
            const hasIncoming = (t.messages || []).some((m: any) => !m.isFromMe);
            if (hasIncoming) {
              list.push({ ...t, workplaceName: wp.name });
            }
          });
        });
        setInboxThreads(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Incoming Mailbox
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Inbox className="w-6 h-6 text-indigo-400" />
            <span>Inbox</span>
          </h1>
          <p className="text-xs text-slate-400">
            Synchronized incoming emails and recipient responses from September 15, 2026 onwards.
          </p>
        </div>

        <div className="space-y-4">
          {inboxThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-bold text-slate-100 text-sm">{thread.subject}</h3>
                  {thread.workplaceName && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      <FolderKanban className="w-3 h-3" />
                      <span>{thread.workplaceName}</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(thread.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{thread.snippet}</p>
            </div>
          ))}
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchInbox}
      />
    </div>
  );
}
