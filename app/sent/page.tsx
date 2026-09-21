"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConversationView } from "@/components/mail/ConversationView";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { Send, FolderKanban, CheckCircle2, Clock } from "lucide-react";

export default function SentMailPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);

  useEffect(() => {
    fetchSentMail();
  }, []);

  const fetchSentMail = async () => {
    try {
      const res = await fetch("/api/workplaces");
      if (res.ok) {
        const wps = await res.json();
        setWorkplaces(wps);

        const list: any[] = [];
        wps.forEach((wp: any) => {
          (wp.threads || []).forEach((t: any) => {
            (t.messages || []).forEach((m: any) => {
              if (m.isFromMe || m.isSent) {
                list.push({ ...m, workplaceName: wp.name, threadSubject: t.subject });
              }
            });
          });
        });

        list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        setSentMessages(list);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Outbound Email Log
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Send className="w-6 h-6 text-indigo-400" />
              <span>Sent Mail (MailOps & Gmail API)</span>
            </h1>
            <p className="text-xs text-slate-400">
              Complete visibility of all emails dispatched directly from MailOps or synced from Gmail Sent.
            </p>
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Direct Compose</span>
          </button>
        </div>

        {/* Sent Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Recipient</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Workplace</th>
                <th className="p-4">Sent Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {sentMessages.map((msg) => {
                const dateStr = new Date(msg.sentAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={msg.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-slate-100">{msg.recipients}</td>
                    <td className="p-4 text-slate-200">{msg.subject}</td>
                    <td className="p-4">
                      {msg.workplaceName ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          <FolderKanban className="w-3 h-3" />
                          <span>{msg.workplaceName}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Direct Mail</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{dateStr}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Dispatched to Gmail</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchSentMail}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchSentMail}
      />
    </div>
  );
}
