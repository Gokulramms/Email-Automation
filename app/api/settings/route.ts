import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

export async function GET() {
  const settings = await db.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      authorizedEmail: "gokulramms@gmail.com",
      syncIntervalSeconds: 90,
      defaultTimerValue: 3,
      defaultTimerUnit: "days",
      timezone: "Asia/Kolkata",
      aiEnabled: false,
      theme: "system",
      density: "comfortable",
      syncFromDate: "2026-09-15",
      demoMode: true,
    },
  });

  // Never return raw secret API keys directly in plain text to client unless requested for form editing
  return NextResponse.json({
    ...settings,
    hasGeminiKey: Boolean(settings.geminiApiKey),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await db.appSettings.upsert({
      where: { id: "default" },
      update: body,
      create: {
        id: "default",
        ...body,
      },
    });

    await db.activity.create({
      data: {
        type: "SETTINGS_CHANGED",
        title: "MailOps settings updated",
        details: "Configuration modified from Settings page",
        timestamp: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
