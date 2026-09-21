import { db } from "../database/db";
import { getGmailClient } from "../gmail/client";
import { evaluateRecipientSLA } from "../timer/sla";

export interface SyncResult {
  success: boolean;
  messagesFetched: number;
  newMessages: number;
  repliesDetected: number;
  overdueUpdated: number;
  lastSyncedAt: Date;
  error?: string;
}

/**
 * Main Gmail Synchronization Engine
 * Fetches messages after September 15, 2026, deduplicates, correlates threads/Workplaces,
 * updates recipient SLA statuses, and logs activities.
 */
export async function runGmailSync(): Promise<SyncResult> {
  const settings = await db.appSettings.upsert({
    where: { id: "default" },
    update: { demoMode: false },
    create: {
      id: "default",
      authorizedEmail: "gokulramms@gmail.com",
      syncIntervalSeconds: 90,
      demoMode: false,
      syncFromDate: "2026-09-15",
    },
  });

  const now = new Date();
  const account = await db.account.findFirst();

  if (!account || !account.accessToken) {
    const overdueCount = await updateOverdueStatuses();
    
    await db.account.upsert({
      where: { email: "gokulramms@gmail.com" },
      update: { lastSyncedAt: now, syncStatus: "DISCONNECTED" },
      create: { email: "gokulramms@gmail.com", syncStatus: "DISCONNECTED", lastSyncedAt: now },
    });

    return {
      success: true,
      messagesFetched: 0,
      newMessages: 0,
      repliesDetected: 0,
      overdueUpdated: overdueCount,
      lastSyncedAt: now,
      error: "Google OAuth not connected yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings or .env.local",
    };
  }

  // Real OAuth Synchronization Logic
  try {
    await db.account.update({
      where: { email: account.email },
      data: { syncStatus: "SYNCING" },
    });

    const gmail = getGmailClient(account.accessToken, account.refreshToken || undefined);
    
    // Query starting Sept 15, 2026 (after:2026/09/14)
    const query = "in:anywhere after:2026/09/14";
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messages = res.data.messages || [];
    let newMessagesCount = 0;
    let repliesDetectedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // Check if message already exists
      const existing = await db.gmailMessage.findUnique({ where: { id: msgRef.id } });
      if (existing) continue;

      // Fetch full message details
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: msgRef.id,
        format: "full",
      });

      const payload = msgRes.data.payload;
      if (!payload) continue;

      const headers = payload.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const subject = getHeader("Subject") || "(No Subject)";
      const from = getHeader("From");
      const to = getHeader("To");
      const cc = getHeader("Cc");
      const bcc = getHeader("Bcc");
      const dateStr = getHeader("Date");
      const inReplyTo = getHeader("In-Reply-To");
      const references = getHeader("References");

      const senderEmail = extractEmail(from);
      const isFromMe = senderEmail.toLowerCase() === account.email.toLowerCase();
      const sentAt = dateStr ? new Date(dateStr) : new Date();
      const threadId = msgRes.data.threadId || msgRef.id;

      // Extract body text / html
      const bodyParts = extractBodyParts(payload);

      // Upsert Thread
      let thread = await db.gmailThread.findUnique({ where: { id: threadId } });
      if (!thread) {
        thread = await db.gmailThread.create({
          data: {
            id: threadId,
            subject,
            snippet: msgRes.data.snippet || "",
            lastMessageAt: sentAt,
            isUnread: !isFromMe,
          },
        });
      } else {
        await db.gmailThread.update({
          where: { id: threadId },
          data: {
            lastMessageAt: sentAt > thread.lastMessageAt ? sentAt : thread.lastMessageAt,
            snippet: msgRes.data.snippet || thread.snippet,
          },
        });
      }

      // Save Message
      await db.gmailMessage.create({
        data: {
          id: msgRef.id,
          threadId,
          sender: from,
          senderEmail,
          recipients: JSON.stringify(to ? [to] : []),
          cc: cc ? JSON.stringify([cc]) : null,
          bcc: bcc ? JSON.stringify([bcc]) : null,
          subject,
          snippet: msgRes.data.snippet || "",
          bodyText: bodyParts.text,
          bodyHtml: bodyParts.html,
          sentAt,
          receivedAt: sentAt,
          isFromMe,
          isSent: isFromMe,
          inReplyTo,
          references,
        },
      });

      newMessagesCount++;

      // Workplace Correlation Logic
      let matchedWorkplaceId = thread.workplaceId;

      if (!matchedWorkplaceId && inReplyTo) {
        // Check recipient record with inReplyTo matching messageId
        const recMatch = await db.workplaceRecipient.findFirst({
          where: { gmailMessageId: inReplyTo },
        });
        if (recMatch) matchedWorkplaceId = recMatch.workplaceId;
      }

      if (!matchedWorkplaceId) {
        // Fallback: Subject match with active Workplaces
        const cleanSub = subject.replace(/^(re|fwd):\s*/i, "").trim();
        const wpMatch = await db.workplace.findFirst({
          where: {
            subject: { contains: cleanSub },
            status: "ACTIVE",
          },
        });
        if (wpMatch) matchedWorkplaceId = wpMatch.id;
      }

      if (matchedWorkplaceId) {
        // Link thread to workplace
        await db.gmailThread.update({
          where: { id: threadId },
          data: { workplaceId: matchedWorkplaceId },
        });

        // If this is an incoming message from a recipient, handle reply status
        if (!isFromMe) {
          const rec = await db.workplaceRecipient.findFirst({
            where: {
              workplaceId: matchedWorkplaceId,
              email: senderEmail.toLowerCase(),
              repliedAt: null,
            },
          });

          if (rec) {
            const sla = evaluateRecipientSLA(rec.sentAt, rec.replyDeadline, sentAt);
            await db.workplaceRecipient.update({
              where: { id: rec.id },
              data: {
                repliedAt: sentAt,
                replyStatus: sla.status,
                lateByMinutes: sla.lateByMinutes,
              },
            });

            repliesDetectedCount++;

            // Create Activity & Notification
            const wp = await db.workplace.findUnique({ where: { id: matchedWorkplaceId } });
            await db.activity.create({
              data: {
                type: "REPLY_RECEIVED",
                title: `Reply received from ${rec.name}`,
                details: `Status: ${sla.status} (${sla.badgeText})`,
                workplaceId: matchedWorkplaceId,
                timestamp: sentAt,
              },
            });

            await db.appNotification.create({
              data: {
                type: "REPLY",
                title: `${rec.name} replied to ${wp?.name || "Workplace"}`,
                message: `Reply received: ${sla.badgeText}`,
              },
            });
          }
        }
      }
    }

    const overdueUpdated = await updateOverdueStatuses();

    await db.account.update({
      where: { email: account.email },
      data: { syncStatus: "IDLE", lastSyncedAt: now },
    });

    return {
      success: true,
      messagesFetched: messages.length,
      newMessages: newMessagesCount,
      repliesDetected: repliesDetectedCount,
      overdueUpdated,
      lastSyncedAt: now,
    };
  } catch (err: any) {
    console.error("Gmail sync error:", err);
    await db.account.update({
      where: { email: account.email },
      data: { syncStatus: "ERROR" },
    });
    return {
      success: false,
      messagesFetched: 0,
      newMessages: 0,
      repliesDetected: 0,
      overdueUpdated: 0,
      lastSyncedAt: now,
      error: err.message || "Failed to sync with Gmail",
    };
  }
}

/**
 * Updates overdue status for all active waiting recipients whose deadline has passed
 */
export async function updateOverdueStatuses(): Promise<number> {
  const now = new Date();
  const waitingRecipients = await db.workplaceRecipient.findMany({
    where: {
      replyStatus: "WAITING",
      repliedAt: null,
      replyDeadline: { lt: now },
    },
    include: { workplace: true },
  });

  let updatedCount = 0;
  for (const rec of waitingRecipients) {
    const sla = evaluateRecipientSLA(rec.sentAt, rec.replyDeadline, null, now);
    await db.workplaceRecipient.update({
      where: { id: rec.id },
      data: {
        replyStatus: "OVERDUE",
        lateByMinutes: sla.lateByMinutes,
      },
    });

    await db.activity.create({
      data: {
        type: "OVERDUE_REACHED",
        title: `${rec.name} became overdue`,
        details: `Deadline was ${rec.replyDeadline.toLocaleTimeString()}`,
        workplaceId: rec.workplaceId,
        timestamp: now,
      },
    });

    updatedCount++;
  }

  return updatedCount;
}

function extractEmail(raw: string): string {
  if (!raw) return "";
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].trim() : raw.trim();
}

function extractBodyParts(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";

  function parsePart(part: any) {
    if (!part) return;
    if (part.mimeType === "text/plain" && part.body?.data) {
      text += Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.mimeType === "text/html" && part.body?.data) {
      html += Buffer.from(part.body.data, "base64").toString("utf-8");
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(parsePart);
    }
  }

  parsePart(payload);
  return { text: text || html.replace(/<[^>]+>/g, " "), html: html || text };
}
