import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { evaluateRecipientSLA } from "@/lib/timer/sla";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workplace = await db.workplace.findUnique({
    where: { id },
    include: {
      recipients: true,
      threads: {
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      },
    },
  });

  if (!workplace) {
    return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
  }

  const now = new Date();
  let waiting = 0;
  let repliedOnTime = 0;
  let overdue = 0;
  let lateReply = 0;

  const evaluatedRecipients = workplace.recipients.map((rec) => {
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

  const totalRecipients = workplace.recipients.length;
  const totalReplies = repliedOnTime + lateReply;

  return NextResponse.json({
    ...workplace,
    recipients: evaluatedRecipients,
    stats: {
      totalRecipients,
      replies: totalReplies,
      waiting,
      repliedOnTime,
      overdue,
      lateReply,
      responsePercentage: totalRecipients > 0 ? Math.round((totalReplies / totalRecipients) * 100) : 0,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await db.workplace.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update workplace" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.workplace.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete workplace" }, { status: 500 });
  }
}
