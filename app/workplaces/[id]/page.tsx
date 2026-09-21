"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConversationView } from "@/components/mail/ConversationView";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { AddRecipientModal } from "@/components/workplaces/AddRecipientModal";
import { BulkFollowUpModal } from "@/components/workplaces/BulkFollowUpModal";
import { SingleFollowUpModal } from "@/components/workplaces/SingleFollowUpModal";
import {
  FolderKanban,
  Send,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function WorkplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workplace, setWorkplace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "recipients" | "conversations" | "activity">("overview");
  
  // Modals state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState(false);
  const [isBulkFollowUpOpen, setIsBulkFollowUpOpen] = useState(false);
  const [isSingleFollowUpOpen, setIsSingleFollowUpOpen] = useState(false);
  const [singleFollowUpTarget, setSingleFollowUpTarget] = useState<{ name: string; email: string } | null>(null);

  const [composeDefaults, setComposeDefaults] = useState<{ to: string; subject: string; body: string }>({
    to: "",
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkplaceDetail();
  }, [id]);

  const fetchWorkplaceDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workplaces/${id}`);
      if (res.ok) setWorkplace(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSingleFollowUp = (recipientName: string, recipientEmail: string) => {
    setSingleFollowUpTarget({ name: recipientName, email: recipientEmail });
    setIsSingleFollowUpOpen(true);
  };

  if (loading || !workplace) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const stats = workplace.stats || { totalRecipients: 0, replies: 0, waiting: 0, overdue: 0, lateReply: 0, responsePercentage: 0 };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link href="/workplaces" className="hover:text-slate-200 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workplaces</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-semibold">{workplace.name}</span>
        </div>

        {/* Workplace Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {workplace.category}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {workplace.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{workplace.name}</h1>
            <p className="text-xs text-slate-400 max-w-2xl">{workplace.description || workplace.subject}</p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsBulkFollowUpOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold text-xs border border-amber-500/30 flex items-center space-x-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Follow-up</span>
            </button>

            <button
              onClick={() => setIsAddRecipientOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recipient</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Overview Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Recipients</span>
            <span className="text-2xl font-bold text-white">{stats.totalRecipients}</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Replies</span>
            <span className="text-2xl font-bold text-emerald-400">{stats.replies}</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Waiting</span>
            <span className="text-2xl font-bold text-amber-400">{stats.waiting}</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Overdue</span>
            <span className="text-2xl font-bold text-rose-400">{stats.overdue}</span>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-semibold">
          {[
            { id: "overview", label: "Overview" },
            { id: "recipients", label: `Recipients (${workplace.recipients.length})` },
            { id: "conversations", label: `Conversations (${workplace.threads.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Recipients Breakdown */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100">Recipient SLA Status Breakdown</h3>

              <div className="space-y-3">
                {workplace.recipients.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-100 text-sm block">{rec.name}</span>
                      <span className="text-slate-400">{rec.email}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <StatusBadge
                        status={rec.currentStatus}
                        badgeText={rec.badgeText}
                        formattedDelay={rec.formattedDelay}
                      />

                      {(rec.currentStatus === "OVERDUE" || rec.currentStatus === "WAITING") && (
                        <button
                          onClick={() => handleOpenSingleFollowUp(rec.name, rec.email)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-medium border border-amber-500/30 transition"
                        >
                          Follow-up
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recipients Detailed Table */}
        {activeTab === "recipients" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Sent Time</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {workplace.recipients.map((rec: any) => {
                  const sentDate = new Date(rec.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                  const deadlineDate = new Date(rec.replyDeadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-semibold text-slate-100">{rec.name}</td>
                      <td className="p-4 text-slate-400">{rec.email}</td>
                      <td className="p-4">{sentDate}</td>
                      <td className="p-4">{deadlineDate}</td>
                      <td className="p-4">
                        <StatusBadge
                          status={rec.currentStatus}
                          badgeText={rec.badgeText}
                          formattedDelay={rec.formattedDelay}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenSingleFollowUp(rec.name, rec.email)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          Follow-up
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Conversations View */}
        {activeTab === "conversations" && (
          <div className="space-y-6">
            {workplace.threads.map((thread: any) => (
              <ConversationView
                key={thread.id}
                threadId={thread.id}
                subject={thread.subject || workplace.subject}
                workplaceName={workplace.name}
                messages={thread.messages || []}
                onReply={(to, sub, msgId) => {
                  setComposeDefaults({ to, subject: sub, body: "" });
                  setIsComposeOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        defaultTo={composeDefaults.to}
        defaultSubject={composeDefaults.subject}
        defaultBody={composeDefaults.body}
        onSuccess={fetchWorkplaceDetail}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchWorkplaceDetail}
      />

      <AddRecipientModal
        isOpen={isAddRecipientOpen}
        onClose={() => setIsAddRecipientOpen(false)}
        workplaceId={workplace.id}
        existingEmails={workplace.recipients.map((r: any) => r.email)}
        onSuccess={fetchWorkplaceDetail}
      />

      <BulkFollowUpModal
        isOpen={isBulkFollowUpOpen}
        onClose={() => setIsBulkFollowUpOpen(false)}
        workplaceId={workplace.id}
        workplaceSubject={workplace.subject || workplace.name}
        recipients={workplace.recipients}
        onSuccess={fetchWorkplaceDetail}
      />

      <SingleFollowUpModal
        isOpen={isSingleFollowUpOpen}
        onClose={() => setIsSingleFollowUpOpen(false)}
        workplaceId={workplace.id}
        workplaceSubject={workplace.subject || workplace.name}
        recipient={singleFollowUpTarget}
        onSuccess={fetchWorkplaceDetail}
      />
    </div>
  );
}
