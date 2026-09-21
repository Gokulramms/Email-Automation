import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/gemini";
import { db } from "@/lib/database/db";

export async function POST(req: Request) {
  try {
    const { threadId } = await req.json();
    if (!threadId) {
      return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
    }

    const thread = await db.gmailThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const messagesText = thread.messages
      .map((m) => `From: ${m.sender} (${m.sentAt.toLocaleString()})\nBody:\n${m.bodyText || m.snippet}`)
      .join("\n\n---\n\n");

    const summary = await AIService.summarizeConversation(thread.subject || "Email Thread", messagesText);

    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Summarization failed" }, { status: 500 });
  }
}
