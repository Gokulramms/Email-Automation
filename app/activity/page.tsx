"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { Activity as ActivityIcon, Send, MessageSquare, AlertTriangle, FolderKanban } from "lucide-react";

export default function ActivityLogPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) setActivities(await res.json());
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
            Audit & Operations Log
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <ActivityIcon className="w-6 h-6 text-indigo-400" />
            <span>Daily Activity Timeline</span>
          </h1>
          <p className="text-xs text-slate-400">
            Audit history of email dispatches, replies received, SLA deadline breaches, and Workplace actions.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
            {activities.map((act) => {
              const date = new Date(act.timestamp);
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

              return (
                <div key={act.id} className="relative pl-9 space-y-1">
                  <div className="absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono text-slate-400">{dateStr} {timeStr}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-300">
                      {act.type}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{act.title}</h4>
                  <p className="text-xs text-slate-400">{act.details}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchActivities}
      />
    </div>
  );
}
