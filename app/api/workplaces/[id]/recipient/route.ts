import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { calculateReplyDeadline } from "@/lib/timer/sla";
import { buildRawEmail, getGmailClient } from "@/lib/gmail/client";
import { formatBodyToHtml } from "@/lib/security/sanitizer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { recipients, sendEmailNow } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
    }

    const workplace = await db.workplace.findUnique({ where: { id } });
    if (!workplace) {
      return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
    }

    const settings = await db.appSettings.findFirst({ where: { id: "default" } });
    const account = await db.account.findFirst({ where: { email: "gokulramms@gmail.com" } });
    const now = new Date();

    const results = [];

    for (const rec of recipients) {
      if (!rec.email) continue;
      const cleanEmail = rec.email.toLowerCase().trim();
      const name = rec.name || cleanEmail.split("@")[0];

      const deadline = calculateReplyDeadline(
        now,
        workplace.replyTimerValue,
        workplace.replyTimerUnit,
        workplace.includeWeekends
      );

      let sentMessageId = `msg_added_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      let sentThreadId = `thread_wp_${workplace.id}`;

      // Send initial email via Gmail API if sendEmailNow is true
      if (sendEmailNow && account?.accessToken) {
        try {
          const personalizedBody = workplace.bodyTemplate.replace(/\{\{name\}\}/g, name);
          const safeHtml = formatBodyToHtml(personalizedBody);

          const gmail = getGmailClient(account.accessToken, account.refreshToken || undefined);
          const raw = buildRawEmail({
            to: cleanEmail,
            cc: workplace.ccRecipients || undefined,
            subject: workplace.subject,
            body: safeHtml,
          });

          const sentRes = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw },
          });

          if (sentRes.data.id) sentMessageId = sentRes.data.id;
          if (sentRes.data.threadId) sentThreadId = sentRes.data.threadId;
        } catch (err: any) {
          console.error(`Failed to send initial email to ${cleanEmail}:`, err);
        }
      }

      // Upsert recipient to prevent duplicates
      const createdRec = await db.workplaceRecipient.upsert({
        where: {
          workplaceId_email: {
            workplaceId: workplace.id,
            email: cleanEmail,
          },
        },
        update: {
          name,
          gmailMessageId: sentMessageId,
          gmailThreadId: sentThreadId,
          sentAt: now,
          replyDeadline: deadline,
          replyStatus: "WAITING",
          repliedAt: null,
          lateByMinutes: null,
        },
        create: {
          workplaceId: workplace.id,
          name,
          email: cleanEmail,
          gmailMessageId: sentMessageId,
          gmailThreadId: sentThreadId,
          sentAt: now,
          replyDeadline: deadline,
          replyStatus: "WAITING",
        },
      });

      results.push(createdRec);
    }

    await db.activity.create({
      data: {
        type: "RECIPIENTS_ADDED",
        title: `Added ${results.length} recipient(s) to ${workplace.name}`,
        details: `Roster updated and SLA deadline initialized`,
        workplaceId: workplace.id,
        timestamp: now,
      },
    });

    return NextResponse.json({ success: true, count: results.length, recipients: results });
  } catch (err: any) {
    console.error("Add recipient error:", err);
    return NextResponse.json({ error: err.message || "Failed to add recipients" }, { status: 500 });
  }
}
