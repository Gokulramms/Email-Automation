import { addHours, addDays, isWeekend, formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

export type SLAStatus = "WAITING" | "REPLIED_ON_TIME" | "OVERDUE" | "LATE_REPLY";

export interface SLAEvaluation {
  status: SLAStatus;
  isOverdue: boolean;
  lateByMinutes: number | null;
  formattedDelay: string | null;
  statusColor: "yellow" | "green" | "red" | "blue" | "gray";
  badgeText: string;
}

/**
 * Calculates the exact reply deadline date based on sent time, timer value, unit, and weekend rules.
 */
export function calculateReplyDeadline(
  sentAt: Date,
  timerValue: number,
  timerUnit: string,
  includeWeekends: boolean = true
): Date {
  let targetDate = new Date(sentAt);

  if (timerUnit === "hours") {
    targetDate = addHours(targetDate, timerValue);
  } else if (timerUnit === "days") {
    if (includeWeekends) {
      targetDate = addDays(targetDate, timerValue);
    } else {
      // Business days calculation
      let addedDays = 0;
      while (addedDays < timerValue) {
        targetDate = addDays(targetDate, 1);
        if (!isWeekend(targetDate)) {
          addedDays++;
        }
      }
    }
  } else if (timerUnit === "business_days") {
    let addedDays = 0;
    while (addedDays < timerValue) {
      targetDate = addDays(targetDate, 1);
      if (!isWeekend(targetDate)) {
        addedDays++;
      }
    }
  } else {
    // Default fallback to days
    targetDate = addDays(targetDate, timerValue);
  }

  return targetDate;
}

/**
 * Computes status, overdue state, and late duration for a given recipient.
 */
export function evaluateRecipientSLA(
  sentAt: Date,
  replyDeadline: Date,
  repliedAt?: Date | null,
  now: Date = new Date()
): SLAEvaluation {
  if (!repliedAt) {
    const isPastDeadline = now > replyDeadline;
    if (isPastDeadline) {
      const lateMinutes = differenceInMinutes(now, replyDeadline);
      return {
        status: "OVERDUE",
        isOverdue: true,
        lateByMinutes: lateMinutes,
        formattedDelay: formatDurationMinutes(lateMinutes),
        statusColor: "red",
        badgeText: "Overdue",
      };
    } else {
      return {
        status: "WAITING",
        isOverdue: false,
        lateByMinutes: null,
        formattedDelay: null,
        statusColor: "yellow",
        badgeText: "Waiting",
      };
    }
  }

  // Recipient has replied
  const repliedDate = new Date(repliedAt);
  const wasOnTime = repliedDate <= replyDeadline;

  if (wasOnTime) {
    const responseTimeMinutes = Math.max(0, differenceInMinutes(repliedDate, sentAt));
    return {
      status: "REPLIED_ON_TIME",
      isOverdue: false,
      lateByMinutes: null,
      formattedDelay: null,
      statusColor: "green",
      badgeText: `Replied in ${formatDurationMinutes(responseTimeMinutes)}`,
    };
  } else {
    const lateMinutes = differenceInMinutes(repliedDate, replyDeadline);
    return {
      status: "LATE_REPLY",
      isOverdue: true,
      lateByMinutes: lateMinutes,
      formattedDelay: formatDurationMinutes(lateMinutes),
      statusColor: "red",
      badgeText: `Late reply (by ${formatDurationMinutes(lateMinutes)})`,
    };
  }
}

/**
 * Formats minutes into human readable string e.g. "1 day 4 hours" or "3 hours 15 mins"
 */
export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 mins";
  
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (remainingHours > 0) parts.push(`${remainingHours} hr${remainingHours > 1 ? "s" : ""}`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

  return parts.join(" ") || "< 1 min";
}
