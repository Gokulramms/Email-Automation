import { NextResponse } from "next/server";
import { createOAuth2Client } from "@/lib/gmail/client";
import { db } from "@/lib/database/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/settings?oauth_error=${encodeURIComponent(error || "no_code")}`);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received from Google");
    }

    oauth2Client.setCredentials(tokens);

    // Fetch authorized user info from Google
    const oauth2 = googleUserInfoClient(tokens.access_token);
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || "gokulramms@gmail.com";

    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Save tokens securely in SQLite DB Account table
    await db.account.upsert({
      where: { email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: expiryDate,
        syncStatus: "IDLE",
        lastSyncedAt: new Date(),
      },
      create: {
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: expiryDate,
        syncStatus: "IDLE",
        lastSyncedAt: new Date(),
      },
    });

    // Ensure AppSettings updated to disable demo mode
    await db.appSettings.upsert({
      where: { id: "default" },
      update: { demoMode: false, authorizedEmail: email },
      create: { id: "default", demoMode: false, authorizedEmail: email },
    });

    await db.activity.create({
      data: {
        type: "OAUTH_CONNECTED",
        title: `Google account connected: ${email}`,
        details: "Gmail API authorization granted successfully",
        timestamp: new Date(),
      },
    });

    return NextResponse.redirect(`${baseUrl}/dashboard?connected=true`);
  } catch (err: any) {
    console.error("Failed to complete Google OAuth exchange:", err);
    return NextResponse.redirect(`${baseUrl}/settings?oauth_error=${encodeURIComponent(err.message)}`);
  }
}

function googleUserInfoClient(accessToken: string) {
  const { google } = require("googleapis");
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.oauth2({ version: "v2", auth });
}
