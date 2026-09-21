import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

export async function GET() {
  const notifications = await db.appNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (body.markAllRead) {
      await db.appNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await db.appNotification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status: 500 });
  }
}
