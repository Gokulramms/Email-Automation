"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Mail, BookOpen, Laptop } from "lucide-react";

interface WorkplaceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkplaceWizardModal({ isOpen, onClose, onSuccess }: WorkplaceWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("InfoSec Review");
  const [timerValue, setTimerValue] = useState(3);
  const [timerUnit, setTimerUnit] = useState("days");
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [recipients, setRecipients] = useState<{ name: string; email: string }[]>([
    { name: "", email: "" },
  ]);

  const [cc, setCc] = useState("security-ops@company.com");
  const [subject, setSubject] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState(
    "Hi {{name}},\n\nOur security system flagged an open operational review regarding your account/resource. Please respond with your business justification within the configured deadline.\n\nRegards,\nGokul Ram\nInfoSec Operations"
  );

  const [libraryUsers, setLibraryUsers] = useState<any[]>([]);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchLibrary();
  }, [isOpen]);

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      if (res.ok) setLibraryUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: "name" | "email", val: string) => {
    const updated = [...recipients];
    updated[index][field] = val;
    setRecipients(updated);
  };

  const addLibraryUserToRecipients = (u: any) => {
    // Check if email already added to recipients
    const exists = recipients.some((r) => r.email.toLowerCase().trim() === u.email.toLowerCase().trim());
    if (!exists) {
      // Replace empty initial recipient or append
      const filtered = recipients.filter((r) => r.email.trim() !== "");
      setRecipients([...filtered, { name: u.name, email: u.email }]);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // Deduplicate recipients by email
      const cleanRecipients = Array.from(
        new Map(
          recipients
            .filter((r) => r.email.trim() !== "")
            .map((r) => [r.email.toLowerCase().trim(), { name: r.name || r.email.split("@")[0], email: r.email.toLowerCase().trim() }])
        ).values()
      );

      if (cleanRecipients.length === 0) {
        throw new Error("Please add at least one valid recipient email address.");
      }

      // Step 1: Create Workplace in DB
      const res = await fetch("/api/workplaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          subject: subject || name,
          bodyTemplate,
          replyTimerValue: timerValue,
          replyTimerUnit: timerUnit,
          includeWeekends,
          timezone,
          ccRecipients: cc,
          recipients: cleanRecipients,
        }),
      });

      const wp = await res.json();
      if (!res.ok) throw new Error(wp.error || "Failed to create workplace");

      // Step 2: Trigger explicit email send dispatch
      const sendRes = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "workplace",
          workplaceId: wp.id,
          recipients: cleanRecipients,
          cc,
          subject: subject || name,
          bodyContent: bodyTemplate,
        }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || "Email dispatch failed");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to finalize workplace");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              {step}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Create New Workplace</h3>
              <p className="text-xs text-slate-400">Step {step} of 5: {getStepTitle(step)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1">
          <div
            className="bg-indigo-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Workplace Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Unauthorized VPN Review"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Audit activity context or notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="InfoSec Review">InfoSec Review</option>
                    <option value="Access Audit">Access Audit</option>
                    <option value="Asset Review">Asset Review</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Vendor Follow-up">Vendor Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Reply SLA Timer Engine</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Reply Within Value</label>
                    <input
                      type="number"
                      min={1}
                      value={timerValue}
                      onChange={(e) => setTimerValue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Timer Unit</label>
                    <select
                      value={timerUnit}
                      onChange={(e) => setTimerUnit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="business_days">Business Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="weekends"
                    checked={includeWeekends}
                    onChange={(e) => setIncludeWeekends(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="weekends" className="text-xs text-slate-300">
                    Include Weekends in SLA Countdown
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Recipients */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Recipients List</h4>
                  <p className="text-xs text-slate-400">Each recipient will receive an individual email dispatch.</p>
                </div>
                <div className="flex items-center space-x-2">
                  {libraryUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLibraryModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium border border-indigo-500/30 flex items-center space-x-1"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Import from Library</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recipients.map((rec, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Name"
                      value={rec.name}
                      onChange={(e) => updateRecipient(i, "name", e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={rec.email}
                      onChange={(e) => updateRecipient(i, "email", e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(i)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CC */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Optional CC Recipients</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="security-ops@company.com, audit@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Comma-separated email addresses to receive copies of each recipient email.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Email Content */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={subject || name}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line for recipients..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Body Template</label>
                <p className="text-xs text-slate-500 mb-2">
                  Use <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400">{"{{name}}"}</code> to dynamically personalize recipient names. Line breaks will be preserved cleanly in sent emails.
                </p>
                <textarea
                  rows={8}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed font-sans"
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Workplace Summary Review</span>
                </div>
                <p className="text-xs text-slate-300">
                  You are about to create <strong className="text-white">{name}</strong> and send individual emails to{" "}
                  <strong className="text-white">{recipients.filter((r) => r.email.trim()).length} unique recipients</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">SLA Timer:</span>{" "}
                    <span className="text-slate-200 font-medium">{timerValue} {timerUnit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">CC:</span>{" "}
                    <span className="text-slate-200 font-medium">{cc || "None"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Subject:</span>
                  <span className="text-slate-100 font-medium">{subject || name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step === 1 ? "Cancel" : "Back"}</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !name}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/20"
              >
                <Mail className="w-4 h-4" />
                <span>{submitting ? "Sending..." : `Send to ${recipients.filter(r => r.email.trim()).length} Recipients`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Library User Selection Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Select Recipients from Library</span>
              </h4>
              <button onClick={() => setShowLibraryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2 text-xs">
              {libraryUsers.map((u) => {
                const isSelected = recipients.some((r) => r.email.toLowerCase().trim() === u.email.toLowerCase().trim());
                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                      {u.assetId && (
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">Asset: {u.assetId}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => addLibraryUserToRecipients(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {isSelected ? "Added" : "+ Add"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
              >
                Done Selecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStepTitle(step: number) {
  switch (step) {
    case 1: return "Workplace Details & SLA Timer";
    case 2: return "Recipient Roster";
    case 3: return "CC Configuration";
    case 4: return "Email Subject & Body";
    case 5: return "Review & Dispatch Confirmation";
    default: return "";
  }
}
