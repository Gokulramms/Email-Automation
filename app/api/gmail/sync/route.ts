import { NextResponse } from "next/server";
import { runGmailSync } from "@/lib/sync/syncEngine";
import { db } from "@/lib/database/db";

export async function GET() {
  const account = await db.account.findFirst({
    where: { email: "gokulramms@gmail.com" },
  });
  const settings = await db.appSettings.findFirst({ where: { id: "default" } });

  return NextResponse.json({
    email: "gokulramms@gmail.com",
    lastSyncedAt: account?.lastSyncedAt || new Date(),
    syncStatus: account?.syncStatus || "IDLE",
    demoMode: settings?.demoMode ?? true,
    syncIntervalSeconds: settings?.syncIntervalSeconds ?? 90,
  });
}

export async function POST() {
  try {
    const result = await runGmailSync();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
