"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { FolderKanban, Plus, Clock, Users, ArrowRight, ShieldCheck, Filter } from "lucide-react";

export default function WorkplacesPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkplaces();
  }, []);

  const fetchWorkplaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workplaces");
      if (res.ok) setWorkplaces(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = workplaces.filter((wp) => {
    if (filter === "ALL") return true;
    return wp.status === filter;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Campaign Operations
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <FolderKanban className="w-6 h-6 text-indigo-400" />
              <span>Workplaces Control Center</span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage security campaigns, track recipient reply deadlines, and trigger targeted follow-ups.
            </p>
          </div>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workplace</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-medium">
          {["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                filter === tab
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab === "ALL" ? "All Workplaces" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Workplaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((wp) => {
            const stats = wp.stats || { responsePercentage: 0, replies: 0, totalRecipients: 0, waiting: 0, overdue: 0 };
            const createdDate = new Date(wp.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

            return (
              <div
                key={wp.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                        {wp.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition mt-2">
                        {wp.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{wp.description || wp.subject}</p>
                    </div>
                  </div>

                  {/* Response Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Response Rate</span>
                      <span className="font-bold text-indigo-400">{stats.responsePercentage}%</span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800">
                      <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${stats.responsePercentage}%` }}></div>
                      <div className="bg-amber-500 h-2 transition-all" style={{ width: `${(stats.waiting / (stats.totalRecipients || 1)) * 100}%` }}></div>
                      <div className="bg-rose-500 h-2 transition-all" style={{ width: `${(stats.overdue / (stats.totalRecipients || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Status Breakdown Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="block font-bold text-emerald-400">{stats.replies}</span>
                      <span className="text-[10px] text-slate-500">Replied</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="block font-bold text-amber-400">{stats.waiting}</span>
                      <span className="text-[10px] text-slate-500">Waiting</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="block font-bold text-rose-400">{stats.overdue}</span>
                      <span className="text-[10px] text-slate-500">Overdue</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SLA: {wp.replyTimerValue} {wp.replyTimerUnit}</span>
                  </div>

                  <Link
                    href={`/workplaces/${wp.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-medium border border-indigo-500/30 flex items-center space-x-1 transition"
                  >
                    <span>Open Workplace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchWorkplaces}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchWorkplaces}
      />
    </div>
  );
}
