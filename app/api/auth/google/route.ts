import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/gmail/client";

export async function GET() {
  try {
    const authUrl = getAuthorizationUrl();
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to initialize Google OAuth" }, { status: 500 });
  }
}
