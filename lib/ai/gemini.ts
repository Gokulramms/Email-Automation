import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../database/db";

export interface AttentionResult {
  needsAttention: boolean;
  reasons: string[];
  label: string; // "Potentially important"
}

export const PRIORITY_KEYWORDS = [
  "action required",
  "action needed",
  "approval required",
  "security incident",
  "urgent",
  "escalation",
  "deadline",
  "high priority",
  "critical",
  "please review",
  "assigned",
  "incident",
];

/**
 * Deterministic rules for detecting emails requiring user attention.
 * Does not rely on AI and does not claim definitive classification.
 */
export function evaluateNeedsAttention(
  subject: string,
  body: string,
  senderEmail: string,
  myEmail: string = "gokulramms@gmail.com"
): AttentionResult {
  const reasons: string[] = [];
  const combinedText = `${subject} ${body}`.toLowerCase();

  for (const kw of PRIORITY_KEYWORDS) {
    if (combinedText.includes(kw)) {
      reasons.push(`Contains '${kw}'`);
    }
  }

  if (combinedText.includes("gokul")) {
    reasons.push("Mentions your name");
  }

  const needsAttention = reasons.length > 0;

  return {
    needsAttention,
    reasons,
    label: "Potentially important",
  };
}

/**
 * Read-only AI Service wrapping Gemini API for summaries.
 * Guaranteed not to mutate database or send emails.
 */
export class AIService {
  static async summarizeConversation(threadSubject: string, messagesText: string): Promise<string> {
    const settings = await db.appSettings.findFirst({ where: { id: "default" } });
    if (!settings?.aiEnabled || !settings?.geminiApiKey) {
      return "AI features are currently turned OFF in Settings. Enable AI to view instant thread summaries.";
    }

    try {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are a concise executive assistant for InfoSec Ops manager Gokul. Summarize the following email thread titled "${threadSubject}" in 2-3 bullet points focusing on key decisions or requested actions.\n\nThread text:\n${messagesText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Summary unavailable.";
    } catch (err: any) {
      console.error("Gemini AI Summarize Error:", err);
      return `AI summary unavailable: ${err.message || "API request failed"}`;
    }
  }

  static async generateDailyDigest(facts: {
    sentToday: number;
    repliesToday: number;
    overdueCount: number;
    activeWorkplaces: number;
    topWorkplaceName: string;
  }): Promise<string> {
    const settings = await db.appSettings.findFirst({ where: { id: "default" } });
    if (!settings?.aiEnabled || !settings?.geminiApiKey) {
      return `Today's Summary: You sent ${facts.sentToday} emails across ${facts.activeWorkplaces} Workplaces. Received ${facts.repliesToday} replies. ${facts.overdueCount} recipients remain overdue. Top activity: ${facts.topWorkplaceName}.`;
    }

    try {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Turn these structured daily facts into a polished 3-sentence end-of-day operational summary for Gokul:\n- Sent today: ${facts.sentToday}\n- Replies received: ${facts.repliesToday}\n- Overdue recipients: ${facts.overdueCount}\n- Active workplaces: ${facts.activeWorkplaces}\n- Most active workplace: ${facts.topWorkplaceName}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || `Daily summary generated based on ${facts.sentToday} sent mails.`;
    } catch (err) {
      return `Today's Summary: You sent ${facts.sentToday} emails across ${facts.activeWorkplaces} Workplaces. Received ${facts.repliesToday} replies. ${facts.overdueCount} recipients remain overdue.`;
    }
  }
}
