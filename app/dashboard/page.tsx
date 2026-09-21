"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import {
  Send,
  MessageSquare,
  Clock,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Activity as ActivityIcon,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  PlusCircle,
  Mail,
} from "lucide-react";

export default function DashboardPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wpRes, actRes, notifRes] = await Promise.all([
        fetch("/api/workplaces"),
        fetch("/api/activity"),
        fetch("/api/notifications"),
      ]);

      if (wpRes.ok) setWorkplaces(await wpRes.json());
      if (actRes.ok) setActivities(await actRes.json());
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Compute aggregated stats cleanly from DB
  let totalSent = 0;
  let totalReplies = 0;
  let totalWaiting = 0;
  let totalOverdue = 0;

  workplaces.forEach((wp) => {
    if (wp.stats) {
      totalSent += wp.stats.totalRecipients || 0;
      totalReplies += wp.stats.replies || 0;
      totalWaiting += wp.stats.waiting || 0;
      totalOverdue += wp.stats.overdue || 0;
    }
  });

  // Extract overdue workplaces for Needs Attention
  const overdueWorkplaces = workplaces.filter((wp) => (wp.stats?.overdue || 0) > 0);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Command Center
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Good evening, Gokul</h1>
            <p className="text-xs text-slate-400">Monday, September 21, 2026 • gokulramms@gmail.com</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <FolderKanban className="w-4 h-4" />
              <span>New Workplace</span>
            </button>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-2"
            >
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Direct Compose</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards - Pure DB Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Sent Today</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">{totalSent}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Across active Workplaces</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Replies Today</span>
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{totalReplies}</span>
              <span className="text-[11px] text-emerald-500/80 block mt-1">Within configured SLA</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Waiting for Reply</span>
              <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{totalWaiting}</span>
              <span className="text-[11px] text-amber-500/80 block mt-1">Deadline active</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Overdue</span>
              <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{totalOverdue}</span>
              <span className="text-[11px] text-rose-500/80 block mt-1">Action required</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Highlights & Attention Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Highlights */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Today's Highlights</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Deterministic
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">Response Summary</span>
                  <span className="text-slate-400">
                    {totalReplies > 0
                      ? `You received ${totalReplies} reply message(s) today.`
                      : "No new replies received yet today."}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">SLA Overdue Status</span>
                  <span className="text-slate-400">
                    {totalOverdue > 0
                      ? `${totalOverdue} recipient(s) are currently overdue for response.`
                      : "Zero overdue recipients. All active deadlines intact."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Needs Attention</span>
              </h3>
              <Link href="/needs-attention" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {overdueWorkplaces.length > 0 ? (
                overdueWorkplaces.map((wp) => (
                  <div
                    key={wp.id}
                    className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 text-sm">{wp.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                          {wp.stats?.overdue} Recipient(s) Overdue
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Subject: {wp.subject}</div>
                    </div>

                    <Link
                      href={`/workplaces/${wp.id}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium border border-indigo-500/30 shrink-0 text-center"
                    >
                      Inspect Workplace
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-200">No items require immediate attention</div>
                  <p className="text-xs text-slate-500">
                    All recipient reply deadlines are on track. Connect Gmail or create a Workplace to manage campaigns.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Workplaces & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Workplaces */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>My Active Workplaces</span>
              </h3>
              <Link href="/workplaces" className="text-xs text-indigo-400 hover:text-indigo-300">
                View all workplaces ({workplaces.length})
              </Link>
            </div>

            {workplaces.length > 0 ? (
              <div className="space-y-4">
                {workplaces.map((wp) => {
                  const stats = wp.stats || { responsePercentage: 0, replies: 0, totalRecipients: 0, waiting: 0, overdue: 0 };
                  return (
                    <Link
                      key={wp.id}
                      href={`/workplaces/${wp.id}`}
                      className="block p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-slate-100 group-hover:text-indigo-400 transition">
                            {wp.name}
                          </span>
                          <span className="text-xs text-slate-400 block mt-0.5">{wp.category} • {wp.subject}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                          {stats.replies} / {stats.totalRecipients} replied ({stats.responsePercentage}%)
                        </span>
                      </div>

                      {/* SLA Progress Bar */}
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex my-2 border border-slate-800">
                        <div
                          className="bg-emerald-500 h-2 transition-all"
                          style={{ width: `${stats.responsePercentage}%` }}
                        ></div>
                        <div
                          className="bg-amber-500 h-2 transition-all"
                          style={{ width: `${(stats.waiting / (stats.totalRecipients || 1)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-rose-500 h-2 transition-all"
                          style={{ width: `${(stats.overdue / (stats.totalRecipients || 1)) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-emerald-400 font-medium">{stats.replies} Replied</span>
                          <span className="text-amber-400 font-medium">{stats.waiting} Waiting</span>
                          <span className="text-rose-400 font-medium">{stats.overdue} Overdue</span>
                        </div>
                        <span className="text-slate-500">Timer: {wp.replyTimerValue} {wp.replyTimerUnit}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <FolderKanban className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">No active workplaces created yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click 'New Workplace' to set up your first email campaign or security audit activity.
                </p>
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Workplace</span>
                </button>
              </div>
            )}
          </div>

          {/* Today's Activity Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <ActivityIcon className="w-4 h-4 text-indigo-400" />
                <span>Today's Activity</span>
              </h3>
              <Link href="/activity" className="text-xs text-indigo-400 hover:text-indigo-300">
                Full Log
              </Link>
            </div>

            {activities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                {activities.slice(0, 6).map((act, i) => {
                  const date = new Date(act.timestamp);
                  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={act.id || i} className="relative pl-7 space-y-0.5 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                      <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                      <div className="font-semibold text-slate-200">{act.title}</div>
                      <div className="text-slate-400">{act.details}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                No activity logged yet today.
              </div>
            )}
          </div>
        </div>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={loadData}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
