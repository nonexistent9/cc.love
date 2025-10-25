import { tool } from "ai";
import { z } from "zod";
import { sendNotificationToAll } from "./send-notification";

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

IMPORTANT: Before using this tool, check the conversation history provided in your system prompt to see if you've already sent a similar notification recently. Only send a notification if:
1. You haven't sent this type of notification recently, OR
2. The user has shown improvement but then regressed, OR
3. The situation has significantly changed and warrants a new notification

Be smart, not spammy. Your goal is to be helpful, not annoying.`,
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
