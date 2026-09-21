"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DirectComposerModal } from "@/components/composer/DirectComposerModal";
import { WorkplaceWizardModal } from "@/components/workplaces/WorkplaceWizardModal";
import { Settings as SettingsIcon, Mail, Clock, Sparkles, Shield, RefreshCw, CheckCircle2, Save, Key } from "lucide-react";

export default function SettingsPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const [syncInterval, setSyncInterval] = useState(90);
  const [demoMode, setDemoMode] = useState(true);
  const [defaultTimerValue, setDefaultTimerValue] = useState(3);
  const [defaultTimerUnit, setDefaultTimerUnit] = useState("days");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSyncInterval(data.syncIntervalSeconds ?? 90);
        setDemoMode(data.demoMode ?? true);
        setDefaultTimerValue(data.defaultTimerValue ?? 3);
        setDefaultTimerUnit(data.defaultTimerUnit ?? "days");
        setTimezone(data.timezone ?? "Asia/Kolkata");
        setAiEnabled(data.aiEnabled ?? false);
        setGeminiApiKey(data.geminiApiKey || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncIntervalSeconds: Number(syncInterval),
          demoMode,
          defaultTimerValue: Number(defaultTimerValue),
          defaultTimerUnit,
          timezone,
          aiEnabled,
          geminiApiKey,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerManualSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/gmail/sync", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenNewWorkplace={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              System Configuration
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <SettingsIcon className="w-6 h-6 text-indigo-400" />
              <span>MailOps Preferences</span>
            </h1>
            <p className="text-xs text-slate-400">
              Configure Gmail API polling, default SLA reply timers, and optional Gemini AI plugin settings.
            </p>
          </div>

          {saved && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: Gmail Connection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Gmail Connection</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block">Target Account</span>
                <span className="font-bold text-slate-100 text-sm">gokulramms@gmail.com</span>
                <span className="text-[11px] text-slate-500 block">Single-tenant personal operations mailbox</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={triggerManualSync}
                  disabled={syncing}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-500/30 flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Background Polling Interval (seconds)</label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 60–120s (90s recommended)</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Environment Mode</label>
                <select
                  value={demoMode ? "demo" : "oauth"}
                  onChange={(e) => setDemoMode(e.target.value === "demo")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="demo">Demo Sandbox Mode (Local Simulation)</option>
                  <option value="oauth">Live Google OAuth 2.0 API</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Reply SLA Timers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Default SLA Reply Timers</span>
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Timer Value</label>
                <input
                  type="number"
                  min={1}
                  value={defaultTimerValue}
                  onChange={(e) => setDefaultTimerValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Unit</label>
                <select
                  value={defaultTimerUnit}
                  onChange={(e) => setDefaultTimerUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                  <option value="business_days">Business Days</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Optional AI Subsystem */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Subsystem (Optional Plugin)</span>
              </h3>

              <div className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  id="aiToggle"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="aiToggle" className="text-slate-300 font-semibold">
                  Enable AI Features (Default: OFF)
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              AI is strictly read-only and optional. It provides thread summaries and daily digests. AI cannot send emails or mutate data.
            </p>

            {aiEnabled && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Gemini API Key</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </main>

      <DirectComposerModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      <WorkplaceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
