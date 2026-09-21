import { google } from "googleapis";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const url =
    redirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`;

  return new google.auth.OAuth2(clientId, clientSecret, url);
}

export function getAuthorizationUrl() {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

export function getGmailClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export interface SendMailParams {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Constructs an RFC 2822 base64url encoded MIME raw email string.
 */
export function buildRawEmail(params: SendMailParams): string {
  const { to, cc, bcc, subject, body, inReplyTo, references } = params;

  const lines: string[] = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
  ];

  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);

  lines.push("");
  lines.push(body);

  const emailStr = lines.join("\r\n");

  return Buffer.from(emailStr)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
