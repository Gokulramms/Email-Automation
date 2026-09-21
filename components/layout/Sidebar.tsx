"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Mail,
  Inbox,
  Send,
  AlertOctagon,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  BookOpen,
  CheckCircle,
} from "lucide-react";

interface SidebarProps {
  onOpenCompose: () => void;
  onOpenNewWorkplace: () => void;
}

export function Sidebar({ onOpenCompose, onOpenNewWorkplace }: SidebarProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Synced just now");
  const [syncStatus, setSyncStatus] = useState<string>("DISCONNECTED");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch("/api/gmail/sync");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.syncStatus || "DISCONNECTED");
        if (data.lastSyncedAt) {
          const d = new Date(data.lastSyncedAt);
          setLastSyncTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      if (res.ok) {
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workplaces", href: "/workplaces", icon: FolderKanban },
    { label: "Library", href: "/library", icon: BookOpen },
    { label: "All Mail", href: "/mail", icon: Mail },
    { label: "Inbox", href: "/inbox", icon: Inbox },
    { label: "Sent", href: "/sent", icon: Send },
    { label: "Needs Attention", href: "/needs-attention", icon: AlertOctagon, badge: "Important" },
    { label: "Activity", href: "/activity", icon: Activity },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 text-slate-300 select-none z-30">
      <div>
        {/* Logo & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">MailOps</span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Gmail Command Center</span>
            </div>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={onOpenNewWorkplace}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-2 px-3 rounded-lg text-sm transition shadow-md shadow-indigo-600/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Workplace</span>
          </button>

          <button
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3 rounded-lg text-sm border border-slate-700 transition active:scale-[0.98]"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Direct Compose</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-slate-800 space-y-3">
        {/* Sync Status Banner */}
        <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncStatus === "DISCONNECTED" ? "bg-rose-400" : "bg-emerald-400"} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${syncStatus === "DISCONNECTED" ? "bg-rose-500" : "bg-emerald-500"}`}></span>
              </span>
              <div>
                <div className="text-slate-200 font-medium">
                  {syncStatus === "DISCONNECTED" ? "Gmail Disconnected" : "Gmail Connected"}
                </div>
                <div className="text-[10px] text-slate-500">{lastSyncTime}</div>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition"
              title="Sync Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>

          {syncStatus === "DISCONNECTED" && (
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded text-[11px] transition shadow shadow-blue-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </a>
          )}
        </div>

        {/* Settings & Profile */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/settings"
            className="flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition w-full"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <div className="truncate">
              <div className="font-semibold text-slate-200 truncate">Gokul Ram</div>
              <div className="text-[10px] text-slate-500 truncate">gokulramms@gmail.com</div>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
