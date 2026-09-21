import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { calculateReplyDeadline, evaluateRecipientSLA } from "@/lib/timer/sla";

export async function GET() {

  const workplaces = await db.workplace.findMany({
    include: {
      recipients: true,
      threads: {
        include: {
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  // Dynamically attach computed SLA counts and recalculate current recipient states
  const enriched = workplaces.map((wp) => {
    let waiting = 0;
    let repliedOnTime = 0;
    let overdue = 0;
    let lateReply = 0;

    const evaluatedRecipients = wp.recipients.map((rec) => {
      const sla = evaluateRecipientSLA(rec.sentAt, rec.replyDeadline, rec.repliedAt, now);
      if (sla.status === "WAITING") waiting++;
      else if (sla.status === "REPLIED_ON_TIME") repliedOnTime++;
      else if (sla.status === "OVERDUE") overdue++;
      else if (sla.status === "LATE_REPLY") lateReply++;

      return {
        ...rec,
        currentStatus: sla.status,
        badgeText: sla.badgeText,
        statusColor: sla.statusColor,
        lateByMinutes: sla.lateByMinutes,
        formattedDelay: sla.formattedDelay,
      };
    });

    const totalRecipients = wp.recipients.length;
    const totalReplies = repliedOnTime + lateReply;
    const responsePercentage = totalRecipients > 0 ? Math.round((totalReplies / totalRecipients) * 100) : 0;

    return {
      ...wp,
      recipients: evaluatedRecipients,
      stats: {
        totalRecipients,
        replies: totalReplies,
        waiting,
        repliedOnTime,
        overdue,
        lateReply,
        responsePercentage,
      },
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      category,
      subject,
      bodyTemplate,
      replyTimerValue,
      replyTimerUnit,
      includeWeekends,
      timezone,
      ccRecipients,
      recipients,
      sendEmailsNow,
    } = body;

    if (!name || !subject || !bodyTemplate) {
      return NextResponse.json({ error: "Missing required fields (name, subject, bodyTemplate)" }, { status: 400 });
    }

    const timerValue = Number(replyTimerValue) || 3;
    const timerUnit = replyTimerUnit || "days";
    const tz = timezone || "Asia/Kolkata";

    const workplace = await db.workplace.create({
      data: {
        name,
        description: description || null,
        category: category || "InfoSec Review",
        subject,
        bodyTemplate,
        replyTimerValue: timerValue,
        replyTimerUnit: timerUnit,
        includeWeekends: includeWeekends ?? true,
        timezone: tz,
        ccRecipients: Array.isArray(ccRecipients) ? ccRecipients.join(", ") : ccRecipients || null,
        status: "ACTIVE",
      },
    });

    const now = new Date();

    // Create recipients if provided
    if (Array.isArray(recipients) && recipients.length > 0) {
      for (const rec of recipients) {
        if (!rec.email) continue;
        const deadline = calculateReplyDeadline(now, timerValue, timerUnit, includeWeekends ?? true);

        await db.workplaceRecipient.create({
          data: {
            workplaceId: workplace.id,
            name: rec.name || rec.email.split("@")[0],
            email: rec.email,
            sentAt: now,
            replyDeadline: deadline,
            replyStatus: "WAITING",
          },
        });
      }
    }

    await db.activity.create({
      data: {
        type: "WORKPLACE_CREATED",
        title: `Created Workplace: ${workplace.name}`,
        details: `Configured ${timerValue} ${timerUnit} SLA for ${recipients?.length || 0} recipients`,
        workplaceId: workplace.id,
        timestamp: now,
      },
    });

    return NextResponse.json(workplace, { status: 201 });
  } catch (err: any) {
    console.error("Create workplace error:", err);
    return NextResponse.json({ error: err.message || "Failed to create workplace" }, { status: 500 });
  }
}
