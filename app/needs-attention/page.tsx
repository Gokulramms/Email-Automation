"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { AlertOctagon, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function NeedsAttentionPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [attentionItems, setAttentionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttentionItems();
  }, []);

  const fetchAttentionItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workplaces");
      if (res.ok) {
        const workplaces = await res.json();
        const items: any[] = [];

        workplaces.forEach((wp: any) => {
          if ((wp.stats?.overdue || 0) > 0) {
            items.push({
              id: wp.id,
              subject: `${wp.name} — ${wp.stats.overdue} Recipient(s) Overdue`,
              sender: "MailOps SLA Engine",
              snippet: `Overdue response deadline for subject: "${wp.subject}". Follow-up recommended.`,
              reasons: ["SLA Deadline Missed", "Action Required for Follow-up"],
              date: "Active SLA Breach",
              link: `/workplaces/${wp.id}`,
            });
          }
        });

        setAttentionItems(items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            Priority Filter
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
            <span>Needs Attention</span>
          </h1>
          <p className="text-xs text-slate-400">
            Deterministic rule-based indicators flagging emails or overdue tasks requiring review.
          </p>
        </div>

        <div className="space-y-4">
          {attentionItems.length > 0 ? (
            attentionItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 hover:border-rose-500/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-100">{item.subject}</h3>
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                        Potentially important
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Source: {item.sender} • {item.date}</span>
                  </div>

                  <Link
                    href={item.link}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium border border-indigo-500/30 flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {item.snippet}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.reasons.map((r: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      Reason: {r}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-base font-bold text-slate-100">No items require immediate attention</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active security escalations or overdue reply deadlines detected. Incoming priority emails will automatically appear here when connected to Gmail API.
              </p>
            </div>
          )}
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchAttentionItems}
      />
    </div>
  );
}
