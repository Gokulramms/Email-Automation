import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { threadId, workplaceId } = body;

    if (!threadId || !workplaceId) {
      return NextResponse.json({ error: "Missing threadId or workplaceId" }, { status: 400 });
    }

    const workplace = await db.workplace.findUnique({ where: { id: workplaceId } });
    if (!workplace) {
      return NextResponse.json({ error: "Workplace not found" }, { status: 404 });
    }

    // Assign thread to Workplace
    const updatedThread = await db.gmailThread.update({
      where: { id: threadId },
      data: { workplaceId },
      include: { messages: true },
    });

    // Record Activity
    await db.activity.create({
      data: {
        type: "WORKPLACE_ASSIGNED",
        title: `Assigned thread "${updatedThread.subject || threadId}" to ${workplace.name}`,
        details: `Linked ${updatedThread.messages.length} message(s)`,
        workplaceId,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, thread: updatedThread });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to assign thread" }, { status: 500 });
  }
}
