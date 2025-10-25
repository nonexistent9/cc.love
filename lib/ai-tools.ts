import { tool } from "ai";
import { z } from "zod";
import { sendNotificationToAll } from "./send-notification";
import { checkDuplicateRules } from "./conversation-memory";
import { determineNotificationType } from "./notification-utils";
import type { ConversationMemory } from "@/types/memory";

/**
 * Request-scoped context for notification cooldown enforcement
 * This allows the tool's execute function to check cooldown rules
 */
let currentRequestMemory: ConversationMemory | null = null;
let currentRequestNotificationCount = 0;

/**
 * Sets the conversation memory context for the current request
 * Must be called before generateText() to enable cooldown enforcement
 */
export function setNotificationContext(memory: ConversationMemory): void {
  currentRequestMemory = memory;
  currentRequestNotificationCount = 0;
}

/**
 * Clears the notification context (optional cleanup)
 */
export function clearNotificationContext(): void {
  currentRequestMemory = null;
  currentRequestNotificationCount = 0;
}

/**
 * AI SDK tool for sending push notifications to all users
 *
 * This tool can be used by LLMs to send push notifications when appropriate.
 * For example, when processing important events, alerts, or user-requested notifications.
 *
 * @example
 * import { generateText } from 'ai';
 * import { google } from '@ai-sdk/google';
 * import { sendPushNotificationTool } from '@/lib/ai-tools';
 *
 * const result = await generateText({
 *   model: google('gemini-2.5-flash'),
 *   tools: {
 *     sendPushNotification: sendPushNotificationTool,
 *   },
 *   maxSteps: 5,
 *   prompt: 'Send a notification to all users about the new feature launch',
 * });
 */
export const sendPushNotificationTool = tool({
  description: `Sends a push notification to all registered users. Use this when you need to alert or notify users about important information, updates, or events.

⚠️ HARD ENFORCEMENT RULES (AUTOMATIC BLOCKING):
1. COOLDOWN: Same notification type will be BLOCKED if sent within the last 5 MINUTES
2. RATE LIMIT: Maximum 1 notification per screenshot analysis (additional calls will be BLOCKED)
3. These rules are enforced at the code level - violations will be automatically rejected

SMART NOTIFICATION LOGIC:
Before using this tool, check the conversation history in your system prompt:
- If you sent this type of notification recently (< 5 min ago) → DON'T send (will be blocked anyway)
- If user showed improvement since last notification → DON'T send (they're learning)
- If user regressed or made the SAME mistake again → OK to send (they need the reminder)
- If this is a different conversation/context → OK to send (fresh start)

Be smart, not spammy. Your goal is to be helpful, not annoying. The system will block duplicate sends automatically.`,
  inputSchema: z.object({
    title: z
      .string()
      .describe("The notification title (short and attention-grabbing)"),
    body: z
      .string()
      .describe("The notification message body (clear and concise)"),
  }),
  execute: async ({ title, body }) => {
    try {
      // CRITICAL: Check cooldown and rate limits BEFORE sending
      if (currentRequestMemory) {
        const notificationType = determineNotificationType(body);

        // LAYER 1: Per-request rate limiting (max 1 notification per request)
        if (currentRequestNotificationCount >= 1) {
          const blockReason = `Rate limit exceeded: Already sent ${currentRequestNotificationCount} notification(s) in this request. Maximum is 1 per request.`;
          console.warn(`[AI Tool] BLOCKED: ${blockReason}`);
          return {
            success: false,
            blocked: true,
            reason: blockReason,
            message:
              "Your notification was blocked by the spam prevention system. You've already sent 1 notification in this request.",
          };
        }

        // LAYER 2: Cooldown enforcement (5-minute window for same type)
        const duplicateCheck = checkDuplicateRules(
          currentRequestMemory,
          notificationType,
        );
        if (duplicateCheck.isDuplicate) {
          const blockReason = duplicateCheck.reason;
          console.warn(
            `[AI Tool] BLOCKED: ${blockReason} (type: ${notificationType})`,
          );
          return {
            success: false,
            blocked: true,
            reason: blockReason,
            notificationType,
            message: `Your notification was blocked by the spam prevention system. ${blockReason}. Give the user some breathing room.`,
          };
        }
      }

      // All checks passed - send the notification
      const result = await sendNotificationToAll(title, body);

      if (!result.success) {
        return {
          success: false,
          blocked: false,
          error: "Failed to send notifications",
          details: result.errors,
        };
      }

      // Increment counter for rate limiting
      currentRequestNotificationCount++;

      return {
        success: true,
        blocked: false,
        message: `Successfully sent push notification to ${result.sent} users`,
        sent: result.sent,
        total: result.total,
        invalidTokens: result.invalidTokens?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        blocked: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Collection of all AI tools for easy import
 */
export const aiTools = {
  sendPushNotification: sendPushNotificationTool,
};
