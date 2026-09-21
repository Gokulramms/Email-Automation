"use client";

import React, { useState, useEffect } from "react";
import { X, Send, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface RecipientItem {
  id: string;
  name: string;
  email: string;
  currentStatus: string;
  badgeText?: string;
}

interface BulkFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  workplaceId: string;
  workplaceSubject: string;
  recipients: RecipientItem[];
  onSuccess: () => void;
}

export function BulkFollowUpModal({
  isOpen,
  onClose,
  workplaceId,
  workplaceSubject,
  recipients = [],
  onSuccess,
}: BulkFollowUpModalProps) {
  // Target ONLY Yellow (WAITING) and Red (OVERDUE) recipients
  const targetRecipients = recipients.filter(
    (r) => r.currentStatus === "WAITING" || r.currentStatus === "OVERDUE"
  );

  const excludedCount = recipients.length - targetRecipients.length;

  const [bodyContent, setBodyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBodyContent(
        `Hi {{name}},\n\nFriendly follow-up regarding our previous communication "${workplaceSubject}". Please provide your response at your earliest convenience.\n\nRegards,\nGokul Ram\nInfoSec Operations`
      );
    }
  }, [isOpen, workplaceSubject]);

  if (!isOpen) return null;

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (targetRecipients.length === 0) {
      setError("No Yellow (Waiting) or Red (Overdue) recipients to send follow-up to.");
      return;
    }

    if (!bodyContent.trim()) {
      setError("Please provide the follow-up message content.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "workplace",
          workplaceId,
          recipients: targetRecipients.map((r) => ({ name: r.name, email: r.email })),
          bodyContent,
          subject: `Follow-up: ${workplaceSubject}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send follow-up emails");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send follow-up");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">Send Bulk Follow-up</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSendFollowUp} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target SLA Notice */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Target Recipients</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {targetRecipients.length} Recipient(s) Selected
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This follow-up will be sent <strong className="text-slate-200">ONLY</strong> to recipients in{" "}
              <span className="text-amber-400 font-semibold">Yellow (Waiting)</span> or{" "}
              <span className="text-rose-400 font-semibold">Red (Overdue)</span> status.
            </p>

            {excludedCount > 0 && (
              <p className="text-[11px] text-emerald-400/90 flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {excludedCount} Green (Replied) recipient(s) automatically excluded.
                </span>
              </p>
            )}

            {/* List targeted recipients */}
            <div className="pt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {targetRecipients.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No pending recipients found.</span>
              ) : (
                targetRecipients.map((rec) => (
                  <span
                    key={rec.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rec.currentStatus === "OVERDUE" ? "bg-rose-500" : "bg-amber-400"
                      }`}
                    />
                    <span>{rec.name}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Message Content Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Follow-up Content
            </label>
            <textarea
              required
              rows={6}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Enter follow-up content here... Use {{name}} to personalize per recipient."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition font-sans leading-relaxed"
            ></textarea>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Pro-tip: <code className="text-indigo-400 font-mono">{"{{name}}"}</code> will automatically be replaced by each recipient's name.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || targetRecipients.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? "Sending..." : `Send Follow-up to ${targetRecipients.length} User(s)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
