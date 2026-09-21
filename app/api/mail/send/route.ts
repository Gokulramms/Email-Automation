import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { buildRawEmail, getGmailClient } from "@/lib/gmail/client";
import { calculateReplyDeadline } from "@/lib/timer/sla";
import { sanitizeEmailHtml, formatBodyToHtml } from "@/lib/security/sanitizer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, workplaceId, recipients, cc, bcc, subject, bodyContent, to } = body;

    const settings = await db.appSettings.findFirst({ where: { id: "default" } });
    const account = await db.account.findFirst({ where: { email: "gokulramms@gmail.com" } });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        {
          error:
            "Google OAuth is not connected. Please click 'Connect Google Account' in Settings or Sidebar to authorize gokulramms@gmail.com.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (mode === "workplace") {
      if (!workplaceId || !Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ error: "Invalid workplace dispatch request" }, { status: 400 });
      }

      const workplace = await db.workplace.findUnique({ where: { id: workplaceId } });
      if (!workplace) {
        return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
      }

      // Deduplicate recipients by lowercase email address
      const uniqueRecipients = Array.from(
        new Map(recipients.map((r: any) => [r.email.toLowerCase().trim(), r])).values()
      );

      let sentCount = 0;
      let failedCount = 0;
      const results = [];

      for (const rec of uniqueRecipients as any[]) {
        const recipientName = rec.name || rec.email.split("@")[0];
        const recipientEmail = rec.email.toLowerCase().trim();

        const personalizedBody = (bodyContent || workplace.bodyTemplate).replace(/\{\{name\}\}/g, recipientName);
        const safeHtml = formatBodyToHtml(personalizedBody);

        const deadline = calculateReplyDeadline(
          now,
          workplace.replyTimerValue,
          workplace.replyTimerUnit,
          workplace.includeWeekends
        );

        let sentMessageId = `msg_sent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        let sentThreadId = `thread_wp_${workplace.id}`;

        try {
          const gmail = getGmailClient(account.accessToken, account.refreshToken || undefined);
          const raw = buildRawEmail({
            to: recipientEmail,
            cc: cc || workplace.ccRecipients || undefined,
            subject: subject || workplace.subject,
            body: safeHtml,
          });

          const sentRes = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw },
          });

          if (sentRes.data.id) sentMessageId = sentRes.data.id;
          if (sentRes.data.threadId) sentThreadId = sentRes.data.threadId;
        } catch (err: any) {
          console.error(`Failed to send email to ${recipientEmail}:`, err);
          failedCount++;
          results.push({ email: recipientEmail, status: "FAILED", error: err.message });
          continue;
        }

        // Upsert WorkplaceRecipient to prevent any duplicate rows
        const createdRec = await db.workplaceRecipient.upsert({
          where: {
            workplaceId_email: {
              workplaceId: workplace.id,
              email: recipientEmail,
            },
          },
          update: {
            name: recipientName,
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
            name: recipientName,
            email: recipientEmail,
            gmailMessageId: sentMessageId,
            gmailThreadId: sentThreadId,
            sentAt: now,
            replyDeadline: deadline,
            replyStatus: "WAITING",
          },
        });

        // Ensure Thread & Message exist in DB
        await db.gmailThread.upsert({
          where: { id: sentThreadId },
          update: { workplaceId: workplace.id, lastMessageAt: now, subject: subject || workplace.subject },
          create: {
            id: sentThreadId,
            workplaceId: workplace.id,
            subject: subject || workplace.subject,
            snippet: personalizedBody.substring(0, 100),
            lastMessageAt: now,
          },
        });

        await db.gmailMessage.create({
          data: {
            id: sentMessageId,
            threadId: sentThreadId,
            sender: "Gokul Ram <gokulramms@gmail.com>",
            senderEmail: "gokulramms@gmail.com",
            recipients: JSON.stringify([recipientEmail]),
            cc: cc || workplace.ccRecipients ? JSON.stringify([cc || workplace.ccRecipients]) : null,
            subject: subject || workplace.subject,
            snippet: personalizedBody.substring(0, 120),
            bodyText: personalizedBody,
            bodyHtml: safeHtml,
            sentAt: now,
            receivedAt: now,
            isFromMe: true,
            isSent: true,
          },
        });

        sentCount++;
        results.push({ id: createdRec.id, email: recipientEmail, status: "SENT", messageId: sentMessageId });
      }

      // Log Activity
      await db.activity.create({
        data: {
          type: "EMAIL_SENT",
          title: `Sent ${sentCount} email${sentCount > 1 ? "s" : ""} for ${workplace.name}`,
          details: `Dispatched individual messages (${failedCount} failed)`,
          workplaceId: workplace.id,
          timestamp: now,
        },
      });

      return NextResponse.json({
        success: true,
        sentCount,
        failedCount,
        results,
      });
    }

    // Mode: "direct" Compose
    if (mode === "direct") {
      if (!to || !subject || !bodyContent) {
        return NextResponse.json({ error: "Missing required fields (to, subject, bodyContent)" }, { status: 400 });
      }

      const safeHtml = formatBodyToHtml(bodyContent);
      let sentMessageId = `msg_direct_${Date.now()}`;
      let sentThreadId = `thread_direct_${Date.now()}`;

      const gmail = getGmailClient(account.accessToken, account.refreshToken || undefined);
      const raw = buildRawEmail({
        to,
        cc,
        bcc,
        subject,
        body: safeHtml,
      });

      const sentRes = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      if (sentRes.data.id) sentMessageId = sentRes.data.id;
      if (sentRes.data.threadId) sentThreadId = sentRes.data.threadId;

      await db.gmailThread.create({
        data: {
          id: sentThreadId,
          subject,
          snippet: bodyContent.substring(0, 100),
          lastMessageAt: now,
        },
      });

      await db.gmailMessage.create({
        data: {
          id: sentMessageId,
          threadId: sentThreadId,
          sender: "Gokul Ram <gokulramms@gmail.com>",
          senderEmail: "gokulramms@gmail.com",
          recipients: JSON.stringify([to]),
          cc: cc ? JSON.stringify([cc]) : null,
          bcc: bcc ? JSON.stringify([bcc]) : null,
          subject,
          snippet: bodyContent.substring(0, 120),
          bodyText: bodyContent,
          bodyHtml: safeHtml,
          sentAt: now,
          receivedAt: now,
          isFromMe: true,
          isSent: true,
        },
      });

      await db.activity.create({
        data: {
          type: "EMAIL_SENT",
          title: `Direct email sent to ${to}`,
          details: `Subject: "${subject}"`,
          timestamp: now,
        },
      });

      return NextResponse.json({
        success: true,
        messageId: sentMessageId,
        threadId: sentThreadId,
      });
    }

    return NextResponse.json({ error: "Invalid send mode specified" }, { status: 400 });
  } catch (err: any) {
    console.error("Send mail error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
