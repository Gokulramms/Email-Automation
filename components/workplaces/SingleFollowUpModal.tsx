"use client";

import React, { useState, useEffect } from "react";
import { X, Send, User, AlertTriangle } from "lucide-react";

interface TargetRecipient {
  name: string;
  email: string;
}

interface SingleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  workplaceId: string;
  workplaceSubject: string;
  recipient: TargetRecipient | null;
  onSuccess: () => void;
}

export function SingleFollowUpModal({
  isOpen,
  onClose,
  workplaceId,
  workplaceSubject,
  recipient,
  onSuccess,
}: SingleFollowUpModalProps) {
  const [cc, setCc] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && recipient) {
      setError(null);
      setCc("");
      setBodyContent(
        `Hi ${recipient.name},\n\nFriendly follow-up regarding our previous communication "${workplaceSubject}". Please provide your response at your earliest convenience.\n\nRegards,\nGokul Ram\nInfoSec Operations`
      );
    }
  }, [isOpen, recipient, workplaceSubject]);

  if (!isOpen || !recipient) return null;

  const handleSendSingleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bodyContent.trim()) {
      setError("Please enter the follow-up message content.");
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
          recipients: [{ name: recipient.name, email: recipient.email }],
          cc: cc.trim() || undefined,
          bodyContent,
          subject: `Follow-up: ${workplaceSubject}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send follow-up email");
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Send Individual Follow-up</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSendSingleFollowUp} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Recipient Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">{recipient.name}</div>
              <div className="text-[11px] text-slate-400">{recipient.email}</div>
            </div>
          </div>

          {/* CC Field (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              CC (Optional)
            </label>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="e.g. manager@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
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
              placeholder="Enter message content..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition font-sans leading-relaxed"
            ></textarea>
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
              disabled={sending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? "Sending..." : "Send Follow-up"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
