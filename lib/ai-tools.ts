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
  description: `Sends a push notification to all registered users. Use this to provide real-time coaching advice to the user.

You should send a notification on every screenshot to help guide the user's dating conversations. Provide timely, actionable advice based on what you see.`,
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
      // Send the notification (cooldown checks removed)
      const result = await sendNotificationToAll(title, body);

      if (!result.success) {
        return {
          success: false,
          error: "Failed to send notifications",
          details: result.errors,
        };
      }

      return {
        success: true,
        message: `Successfully sent push notification to ${result.sent} users`,
        sent: result.sent,
        total: result.total,
        invalidTokens: result.invalidTokens?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
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
