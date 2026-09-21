import React from "react";
import { Clock, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { SLAStatus } from "@/lib/timer/sla";

interface StatusBadgeProps {
  status: SLAStatus | string;
  badgeText?: string;
  formattedDelay?: string | null;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, badgeText, formattedDelay, size = "md" }: StatusBadgeProps) {
  let colorClasses = "bg-amber-500/10 text-amber-500 border-amber-500/30";
  let icon = <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />;
  let label = badgeText || "Waiting";

  switch (status) {
    case "WAITING":
      colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400";
      icon = <Clock className="w-3.5 h-3.5 mr-1" />;
      label = badgeText || "Waiting for reply";
      break;

    case "REPLIED_ON_TIME":
      colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400";
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      label = badgeText || "Replied on time";
      break;

    case "OVERDUE":
      colorClasses = "bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400";
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      label = badgeText || (formattedDelay ? `Overdue by ${formattedDelay}` : "Overdue");
      break;

    case "LATE_REPLY":
      colorClasses = "bg-red-500/20 text-red-400 border-red-500/40 dark:bg-red-500/15 dark:text-red-400";
      icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      label = badgeText || (formattedDelay ? `Late reply (by ${formattedDelay})` : "Late reply");
      break;

    case "ACTIVE":
      colorClasses = "bg-blue-500/15 text-blue-400 border-blue-500/30";
      icon = <Clock className="w-3.5 h-3.5 mr-1" />;
      label = "Active";
      break;

    case "COMPLETED":
      colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      label = "Completed";
      break;

    default:
      colorClasses = "bg-slate-500/15 text-slate-400 border-slate-500/30";
      icon = <Clock className="w-3.5 h-3.5 mr-1" />;
      label = status;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-3 py-1 text-sm font-semibold" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses} shadow-sm backdrop-blur-xs transition-all`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
