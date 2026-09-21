import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

export async function GET() {
  const activities = await db.activity.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return NextResponse.json(activities);
}
