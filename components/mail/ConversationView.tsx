"use client";

import React, { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { sanitizeEmailHtml } from "@/lib/security/sanitizer";
import { FolderKanban, Reply, ReplyAll, Forward, User, Calendar, ShieldAlert, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderEmail: string;
  recipients: string;
  subject: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  sentAt: string | Date;
  isFromMe: boolean;
}

interface ConversationViewProps {
  threadId: string;
  subject: string;
  workplaceName?: string | null;
  workplaceId?: string | null;
  messages: Message[];
  onReply: (to: string, subject: string, inReplyTo: string) => void;
  onAssignWorkplace?: () => void;
}

export function ConversationView({
  threadId,
  subject,
  workplaceName,
  workplaceId,
  messages,
  onReply,
  onAssignWorkplace,
}: ConversationViewProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchAiSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      const data = await res.json();
      setAiSummary(data.summary || "No summary returned.");
    } catch (e) {
      setAiSummary("Unable to load summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">{subject}</h2>
            {workplaceName ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{workplaceName}</span>
              </span>
            ) : (
              <button
                onClick={onAssignWorkplace}
                className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full transition"
              >
                + Assign to Workplace
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400">Gmail Thread ID: {threadId}</span>
        </div>

        <button
          onClick={fetchAiSummary}
          disabled={loadingSummary}
          className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center space-x-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{loadingSummary ? "Summarizing..." : "Summarize Thread with AI"}</span>
        </button>
      </div>

      {/* AI Summary Banner */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed space-y-1">
          <div className="font-semibold text-indigo-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Executive Summary</span>
          </div>
          <div className="whitespace-pre-wrap">{aiSummary}</div>
        </div>
      )}

      {/* Messages Timeline */}
      <div className="space-y-4">
        {messages.map((msg, idx) => {
          const sentDate = new Date(msg.sentAt);
          const safeBody = sanitizeEmailHtml(msg.bodyHtml || msg.bodyText);

          return (
            <div
              key={msg.id}
              className={`rounded-xl border p-5 transition ${
                msg.isFromMe
                  ? "bg-slate-950/80 border-slate-800"
                  : "bg-slate-900 border-indigo-500/20 shadow-md shadow-indigo-500/5"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      msg.isFromMe ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {msg.isFromMe ? "Me" : msg.sender.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">
                      {msg.sender} {msg.isFromMe && <span className="text-xs text-indigo-400 font-normal">(You)</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">To: {msg.recipients}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{sentDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div
                className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: safeBody || "<p>(No content)</p>" }}
              ></div>

              {/* Action Bar */}
              <div className="pt-4 mt-4 border-t border-slate-800/40 flex items-center space-x-2 text-xs">
                <button
                  onClick={() => onReply(msg.senderEmail, `Re: ${subject}`, msg.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center space-x-1 transition"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>

                <button
                  onClick={() => onReply(msg.senderEmail, `Re: ${subject}`, msg.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center space-x-1 transition"
                >
                  <ReplyAll className="w-3.5 h-3.5" />
                  <span>Reply All</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
