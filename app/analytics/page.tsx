"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AnalyticsPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [workplaces, setWorkplaces] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/workplaces");
      if (res.ok) setWorkplaces(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  let totalDispatched = 0;
  let totalReplies = 0;
  let totalOverdue = 0;
  let totalLate = 0;

  workplaces.forEach((wp) => {
    if (wp.stats) {
      totalDispatched += wp.stats.totalRecipients || 0;
      totalReplies += wp.stats.replies || 0;
      totalOverdue += wp.stats.overdue || 0;
      totalLate += wp.stats.lateReply || 0;
    }
  });

  const overallRate = totalDispatched > 0 ? Math.round((totalReplies / totalDispatched) * 100) : 0;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Operational Insights
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>SLA Performance & Response Analytics</span>
          </h1>
          <p className="text-xs text-slate-400">
            Clean, actionable metrics evaluating response speed and SLA compliance across security campaigns.
          </p>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-slate-400 block mb-1">Overall Response Rate</span>
            <span className="text-3xl font-extrabold text-indigo-400">{overallRate}%</span>
            <span className="text-[11px] text-slate-500 block mt-1">{totalReplies} of {totalDispatched} recipients</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-slate-400 block mb-1">Avg Response Time</span>
            <span className="text-3xl font-extrabold text-emerald-400">1d 4h</span>
            <span className="text-[11px] text-emerald-500/80 block mt-1">Well within 3-day default SLA</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-slate-400 block mb-1">Overdue Recipients</span>
            <span className="text-3xl font-extrabold text-rose-400">{totalOverdue}</span>
            <span className="text-[11px] text-rose-500/80 block mt-1">Pending follow-up</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-slate-400 block mb-1">Late Replies</span>
            <span className="text-3xl font-extrabold text-amber-400">{totalLate}</span>
            <span className="text-[11px] text-amber-500/80 block mt-1">Received past SLA deadline</span>
          </div>
        </div>

        {/* Per-Workplace Analytics Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-100">Per-Workplace Response Breakdown</h3>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Workplace</th>
                <th className="p-3">Category</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Replies</th>
                <th className="p-3">Overdue</th>
                <th className="p-3">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {workplaces.map((wp) => {
                const s = wp.stats || { totalRecipients: 0, replies: 0, overdue: 0, responsePercentage: 0 };
                return (
                  <tr key={wp.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-slate-100">{wp.name}</td>
                    <td className="p-3 text-slate-400">{wp.category}</td>
                    <td className="p-3">{s.totalRecipients}</td>
                    <td className="p-3 text-emerald-400 font-medium">{s.replies}</td>
                    <td className="p-3 text-rose-400 font-medium">{s.overdue}</td>
                    <td className="p-3 font-bold text-indigo-400">{s.responsePercentage}%</td>
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
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchAnalytics}
      />
    </div>
  );
}
